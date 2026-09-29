"""Dayak — Telegram nanny desk (aiogram 3).

Env:
  BOT_TOKEN                 from @BotFather
  ADMIN_CHAT_IDS            comma-separated Telegram user ids that get every new request
  GOOGLE_SHEET_ID           optional — see storage.py
  GOOGLE_CREDENTIALS_JSON   optional — path to service account json
"""
from __future__ import annotations

import asyncio
import logging
import os

from aiogram import Bot, Dispatcher, F, Router
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import KeyboardButton, Message, ReplyKeyboardMarkup, ReplyKeyboardRemove

from storage import Storage
from texts import LANGS, opts, t

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("dayak")

BOT_TOKEN = os.environ["BOT_TOKEN"]
ADMINS = [int(x) for x in os.getenv("ADMIN_CHAT_IDS", "").split(",") if x.strip()]

router = Router()
store = Storage()
log.info("storage mode: %s", store.mode)


# ---------- states ----------
class Parent(StatesGroup):
    age = State(); hours = State(); district = State(); lang = State(); start = State()
    backup = State(); phone = State(); source = State(); notes = State()


class Nanny(StatesGroup):
    name = State(); age = State(); exp = State(); ages = State(); langs = State(); district = State()
    hours = State(); rate = State(); backup = State(); refs = State(); phone = State()


# ---------- keyboards ----------
def kb(rows: list[list[str]], lang: str, cancel: bool = True, phone: bool = False) -> ReplyKeyboardMarkup:
    keyboard = [[KeyboardButton(text=c) for c in r] for r in rows]
    if phone:
        keyboard.insert(0, [KeyboardButton(text=t("btn_share_phone", lang), request_contact=True)])
    if cancel:
        keyboard.append([KeyboardButton(text=t("btn_cancel", lang))])
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True, one_time_keyboard=True)


def grid(items: list[str], per_row: int = 2) -> list[list[str]]:
    return [items[i:i + per_row] for i in range(0, len(items), per_row)]


def lang_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text=v) for v in LANGS.values()]], resize_keyboard=True)


def menu_kb(lang: str) -> ReplyKeyboardMarkup:
    return kb([[t("btn_find", lang)], [t("btn_nanny", lang)], [t("btn_lang", lang)]], lang, cancel=False)


async def get_lang(state: FSMContext) -> str:
    return (await state.get_data()).get("lang", "en")


def is_cancel(msg: Message) -> bool:
    return msg.text in {t("btn_cancel", l) for l in LANGS}


# ---------- entry ----------
@router.message(CommandStart())
@router.message(Command("lang"))
@router.message(F.text.in_({t("btn_lang", l) for l in LANGS}))
async def start(msg: Message, state: FSMContext) -> None:
    lang = await get_lang(state)
    await state.clear()
    await state.update_data(lang=lang)
    await msg.answer(t("choose_lang", "en"), reply_markup=lang_kb())


@router.message(F.text.in_(set(LANGS.values())))
async def set_lang(msg: Message, state: FSMContext) -> None:
    lang = next(k for k, v in LANGS.items() if v == msg.text)
    await state.clear()
    await state.update_data(lang=lang)
    await msg.answer(t("welcome", lang), reply_markup=menu_kb(lang))


@router.message(F.text.in_({t("btn_cancel", l) for l in LANGS}))
async def cancel(msg: Message, state: FSMContext) -> None:
    lang = await get_lang(state)
    await state.clear()
    await state.update_data(lang=lang)
    await msg.answer(t("cancelled", lang), reply_markup=menu_kb(lang))


# ---------- generic step helper ----------
async def ask(msg: Message, state: FSMContext, key: str, next_state: State, choices: str | None = None,
              per_row: int = 2, skip: bool = False, phone: bool = False) -> None:
    lang = await get_lang(state)
    rows = grid(opts(choices, lang), per_row) if choices else []
    if skip:
        rows.append([t("btn_skip", lang)])
    await state.set_state(next_state)
    await msg.answer(t(key, lang), reply_markup=kb(rows, lang, phone=phone) if (rows or phone) else kb([], lang))


async def take(msg: Message, state: FSMContext, field: str, choices: str | None = None) -> bool:
    """Store the answer; return False (and re-prompt) if a choice question got free text."""
    lang = await get_lang(state)
    val = msg.text or ""
    if msg.contact:
        val = msg.contact.phone_number
    if msg.text == t("btn_skip", lang):
        val = ""
    elif choices and val not in opts(choices, lang):
        await msg.answer(t("invalid", lang))
        return False
    await state.update_data(**{field: val})
    return True


# ---------- parent flow ----------
@router.message(F.text.in_({t("btn_find", l) for l in LANGS}))
async def p_start(msg: Message, state: FSMContext) -> None:
    await ask(msg, state, "p_age", Parent.age)


@router.message(Parent.age)
async def p_age(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "child_age"):
        await ask(msg, state, "p_hours", Parent.hours, "hours_opts", per_row=1)


@router.message(Parent.hours)
async def p_hours(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "hours", "hours_opts"):
        await ask(msg, state, "p_district", Parent.district, "districts", per_row=3)


@router.message(Parent.district)
async def p_district(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "district", "districts"):
        await ask(msg, state, "p_lang", Parent.lang, "nanny_langs")


@router.message(Parent.lang)
async def p_lang(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "nanny_lang", "nanny_langs"):
        await ask(msg, state, "p_start", Parent.start, "start_opts")


@router.message(Parent.start)
async def p_startdate(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "start", "start_opts"):
        await ask(msg, state, "p_backup", Parent.backup, "backup_opts", per_row=1)


@router.message(Parent.backup)
async def p_backup(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "backup_importance", "backup_opts"):
        await ask(msg, state, "p_phone", Parent.phone, phone=True)


@router.message(Parent.phone)
async def p_phone(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "phone"):
        await ask(msg, state, "p_source", Parent.source, "source_opts")


@router.message(Parent.source)
async def p_source(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "source", "source_opts"):
        await ask(msg, state, "p_notes", Parent.notes, skip=True)


@router.message(Parent.notes)
async def p_notes(msg: Message, state: FSMContext, bot: Bot) -> None:
    if not await take(msg, state, "notes"):
        return
    d = await state.get_data()
    lang = d.get("lang", "en")
    row = {**d, "tg_user_id": msg.from_user.id, "tg_username": msg.from_user.username or "", "status": "new"}
    rid = store.append("parents", row)
    await state.clear()
    await state.update_data(lang=lang)
    await msg.answer(t("p_done", lang, id=rid), reply_markup=menu_kb(lang))
    await notify(bot, "👶 NEW PARENT REQUEST", rid, row,
                 ["child_age", "hours", "district", "nanny_lang", "start", "backup_importance", "phone", "source", "notes"])


# ---------- nanny flow ----------
@router.message(F.text.in_({t("btn_nanny", l) for l in LANGS}))
async def n_start(msg: Message, state: FSMContext) -> None:
    lang = await get_lang(state)
    await msg.answer(t("n_intro", lang))
    await ask(msg, state, "n_name", Nanny.name)


@router.message(Nanny.name)
async def n_name(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "name"):
        await ask(msg, state, "n_age", Nanny.age)


@router.message(Nanny.age)
async def n_age(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "age"):
        await ask(msg, state, "n_exp", Nanny.exp)


@router.message(Nanny.exp)
async def n_exp(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "experience_years"):
        await ask(msg, state, "n_ages", Nanny.ages)


@router.message(Nanny.ages)
async def n_ages(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "child_ages"):
        await ask(msg, state, "n_langs", Nanny.langs)


@router.message(Nanny.langs)
async def n_langs(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "languages"):
        await ask(msg, state, "n_district", Nanny.district, "districts", per_row=3)


@router.message(Nanny.district)
async def n_district(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "district", "districts"):
        await ask(msg, state, "n_hours", Nanny.hours, "hours_opts", per_row=1)


@router.message(Nanny.hours)
async def n_hours(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "hours", "hours_opts"):
        await ask(msg, state, "n_rate", Nanny.rate)


@router.message(Nanny.rate)
async def n_rate(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "rate"):
        await ask(msg, state, "n_backup", Nanny.backup, "yn_opts", per_row=3)


@router.message(Nanny.backup)
async def n_backup(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "backup_ok", "yn_opts"):
        await ask(msg, state, "n_refs", Nanny.refs, "yn_opts", per_row=3)


@router.message(Nanny.refs)
async def n_refs(msg: Message, state: FSMContext) -> None:
    if await take(msg, state, "has_refs", "yn_opts"):
        await ask(msg, state, "n_phone", Nanny.phone, phone=True)


@router.message(Nanny.phone)
async def n_phone(msg: Message, state: FSMContext, bot: Bot) -> None:
    if not await take(msg, state, "phone"):
        return
    d = await state.get_data()
    lang = d.get("lang", "en")
    row = {**d, "tg_user_id": msg.from_user.id, "tg_username": msg.from_user.username or "",
           "source": "telegram_bot", "vetted": "no"}
    rid = store.append("nannies", row)
    await state.clear()
    await state.update_data(lang=lang)
    await msg.answer(t("n_done", lang, id=rid), reply_markup=menu_kb(lang))
    await notify(bot, "🙋‍♀️ NEW NANNY", rid, row,
                 ["name", "age", "experience_years", "child_ages", "languages", "district", "hours", "rate",
                  "backup_ok", "has_refs", "phone"])


# ---------- admin ----------
async def notify(bot: Bot, title: str, rid: int, row: dict, fields: list[str]) -> None:
    lines = [f"<b>{title} #{rid}</b>"]
    lines += [f"{f}: {row.get(f, '')}" for f in fields if row.get(f)]
    u = row.get("tg_username")
    lines.append(f"tg: @{u}" if u else f"tg id: {row.get('tg_user_id')}")
    for admin in ADMINS:
        try:
            await bot.send_message(admin, "\n".join(lines), parse_mode="HTML")
        except Exception as e:  # noqa: BLE001
            log.warning("notify %s failed: %s", admin, e)


@router.message(Command("id"))
async def my_id(msg: Message) -> None:
    await msg.answer(f"Your Telegram id: <code>{msg.from_user.id}</code>", parse_mode="HTML")


@router.message()
async def fallback(msg: Message, state: FSMContext) -> None:
    lang = await get_lang(state)
    await msg.answer(t("welcome", lang), reply_markup=menu_kb(lang))


async def main() -> None:
    bot = Bot(BOT_TOKEN)
    dp = Dispatcher()
    dp.include_router(router)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
