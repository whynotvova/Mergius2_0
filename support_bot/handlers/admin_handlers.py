from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from config import ADMIN_IDS
from keyboards.keyboards import get_admin_panel, get_users_list, get_user_actions, get_tariff_keyboard, get_unanswered_tickets_keyboard
from aiogram.filters import Command
import logging
from utils import check_site

logger = logging.getLogger(__name__)

router = Router()

class Broadcast(StatesGroup):
    message = State()

class ReplyTicket(StatesGroup):
    message = State()
    ticket_id = State()
    user_id = State()

@router.message(Command("admin"))
async def cmd_admin(message: Message):
    user_id = message.from_user.id
    logger.debug(f"Получена команда /admin от пользователя {user_id}")
    if user_id not in ADMIN_IDS:
        logger.info(f"Пользователь {user_id} не имеет доступа к админ-панели")
        await message.answer("У вас нет доступа к админ-панели.")
        return
    await message.answer("Админ-панель", reply_markup=get_admin_panel())
    logger.debug(f"Админ-панель открыта для пользователя {user_id}")

@router.callback_query(F.data == "admin_panel")
async def show_admin_panel(callback: CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.message.answer("У вас нет доступа к админ-панели.")
        return
    await callback.message.edit_text("Админ-панель", reply_markup=get_admin_panel())
    await callback.answer()

@router.callback_query(F.data == "admin_stats")
async def show_stats(callback: CallbackQuery, db):
    if callback.from_user.id not in ADMIN_IDS:
        return
    stats = await db.get_stats()
    if stats:
        text = (
            f"📊 Статистика:\n"
            f"Пользователей в боте: {stats['bot_users']}\n"
            f"Пользователей на сайте: {stats['site_users']}\n"
            f"Открытых заявок: {stats['open_tickets']}"
        )
    else:
        text = "Ошибка получения статистики."
    await callback.message.edit_text(text, reply_markup=get_admin_panel())
    await callback.answer()

@router.callback_query(F.data == "admin_users")
async def show_users(callback: CallbackQuery, db):
    if callback.from_user.id not in ADMIN_IDS:
        return
    users = await db.get_site_users()
    if not users:
        await callback.message.edit_text("Пользователи сайта не найдены.", reply_markup=get_admin_panel())
    else:
        await callback.message.edit_text("Выберите пользователя сайта:", reply_markup=get_users_list(users))
    await callback.answer()

@router.callback_query(F.data.startswith("user_"))
async def show_user_info(callback: CallbackQuery, db):
    if callback.from_user.id not in ADMIN_IDS:
        return
    user_id = int(callback.data.split("_")[1])
    user = await db.get_site_user(user_id)
    if user:
        text = (
            f"👤 Пользователь: {user['username'] or 'No Username'}\n"
            f"ID: {user['user_id']}\n"
            f"Тариф: {user['account_type_id']}"
        )
        await callback.message.edit_text(text, reply_markup=get_user_actions(user_id))
    else:
        await callback.message.edit_text("Пользователь сайта не найден.", reply_markup=get_admin_panel())
    await callback.answer()

@router.callback_query(F.data.startswith("change_tariff_"))
async def change_tariff(callback: CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        return
    user_id = int(callback.data.split("_")[2])
    await callback.message.edit_text("Выберите тариф:", reply_markup=get_tariff_keyboard(user_id))
    await callback.answer()

@router.callback_query(F.data.startswith("set_tariff_"))
async def set_tariff(callback: CallbackQuery, db):
    if callback.from_user.id not in ADMIN_IDS:
        return
    parts = callback.data.split("_")
    user_id = int(parts[2])
    tariff = parts[3]
    await db.update_site_tariff(user_id, tariff)
    await callback.message.edit_text(f"Тариф для пользователя {user_id} изменён на {tariff}.", reply_markup=get_user_actions(user_id))
    await callback.answer()

@router.callback_query(F.data == "admin_broadcast")
async def start_broadcast(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        return
    await callback.message.edit_text("Введите сообщение для рассылки:")
    await state.set_state(Broadcast.message)
    await callback.answer()

@router.message(Broadcast.message)
async def send_broadcast(message: Message, state: FSMContext, db):
    if message.from_user.id not in ADMIN_IDS:
        return
    users = await db.get_users()
    successful = 0
    failed = 0
    deleted = 0
    for user in users:
        user_id = user['user_id']
        try:
            await message.bot.send_message(user_id, message.text)
            successful += 1
            logger.debug(f"Сообщение отправлено пользователю {user_id}")
        except Exception as e:
            failed += 1
            await db.delete_user(user_id)
            deleted += 1
            logger.error(f"Ошибка отправки сообщения пользователю {user_id}: {e}")
    await message.answer(
        f"Рассылка завершена.\n"
        f"Успешно: {successful}\n"
        f"Не отправлено: {failed}\n"
        f"Удалено пользователей: {deleted}",
        reply_markup=get_admin_panel()
    )
    logger.info(f"Рассылка завершена: успешно={successful}, не отправлено={failed}, удалено={deleted}")
    await state.clear()

@router.callback_query(F.data == "admin_tickets")
async def show_unanswered_tickets(callback: CallbackQuery, db):
    if callback.from_user.id not in ADMIN_IDS:
        return
    tickets = await db.get_unanswered_tickets()
    if not tickets:
        await callback.message.edit_text("Неотвеченных заявок нет.", reply_markup=get_admin_panel())
    else:
        text = "📥 Неотвеченные заявки:\n"
        for ticket in tickets:
            user = await db.get_user(ticket['user_id'])
            username = user['username'] if user else "Unknown"
            content = ticket['message_content'][:50] + "..." if len(str(ticket['message_content'])) > 50 else ticket['message_content']
            text += f"Заявка #{ticket['ticket_id']} от {username} (ID: {ticket['user_id']}): {content}\n"
        keyboard = get_unanswered_tickets_keyboard(tickets)
        await callback.message.edit_text(text, reply_markup=keyboard)
    await callback.answer()

@router.callback_query(F.data == "check_site")
async def check_site_status(callback: CallbackQuery):
    if callback.from_user.id not in ADMIN_IDS:
        await callback.message.answer("У вас нет доступа к админ-панели.")
        return
    logger.debug(f"Проверка статуса сайта инициирована пользователем {callback.from_user.id}")
    try:
        result = await check_site()
        await callback.message.edit_text(result, reply_markup=get_admin_panel())
        logger.debug(f"Результат проверки сайта: {result}")
    except Exception as e:
        await callback.message.edit_text(f"Ошибка проверки сайта: {e}", reply_markup=get_admin_panel())
        logger.error(f"Ошибка проверки сайта: {e}")
    await callback.answer()

@router.callback_query(F.data.startswith("reply_ticket_"))
async def reply_to_ticket(callback: CallbackQuery, state: FSMContext):
    if callback.from_user.id not in ADMIN_IDS:
        return
    parts = callback.data.split("_")
    ticket_id = int(parts[2])
    user_id = int(parts[3])
    await callback.message.edit_text("Введите ответ для пользователя:")
    await state.set_state(ReplyTicket.message)
    await state.update_data(ticket_id=ticket_id, user_id=user_id)
    await callback.answer()

@router.message(ReplyTicket.message)
async def send_reply(message: Message, state: FSMContext, db):
    if message.from_user.id not in ADMIN_IDS:
        return
    data = await state.get_data()
    ticket_id = data['ticket_id']
    user_id = data['user_id']
    try:
        await message.bot.send_message(user_id, f"Ответ от поддержки: {message.text}")
        await db.mark_ticket_answered(ticket_id)
        await message.answer("Ответ отправлен.", reply_markup=get_admin_panel())
        logger.debug(f"Ответ на заявку #{ticket_id} отправлен пользователю {user_id}")
    except Exception as e:
        await message.answer(f"Ошибка отправки ответа: {e}", reply_markup=get_admin_panel())
        logger.error(f"Ошибка отправки ответа на заявку #{ticket_id}: {e}")
    await state.clear()