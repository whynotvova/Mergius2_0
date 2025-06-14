from aiogram import Router, F
from aiogram.types import Message, ContentType
from config import ADMIN_IDS
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.filters import StateFilter
from keyboards.keyboards import get_ticket_actions
import logging
from handlers.admin_handlers import ReplyTicket

logger = logging.getLogger(__name__)

router = Router()

class Broadcast(StatesGroup):
    message = State()

@router.message(~F.text.startswith('/'), ~StateFilter(ReplyTicket.message))  # Skip commands and ReplyTicket state
async def handle_user_message(message: Message, db, state: FSMContext):
    user_id = message.from_user.id
    username = message.from_user.username or message.from_user.full_name
    current_state = await state.get_state()
    logger.debug(f"Обработка сообщения от пользователя {user_id}: {message.text or message.content_type}, состояние: {current_state}")
    await db.add_user(user_id, username)

    message_type = message.content_type
    message_content = ""

    if message_type == ContentType.TEXT:
        message_content = message.text
    elif message_type == ContentType.PHOTO:
        message_content = message.photo[-1].file_id
    elif message_type == ContentType.VIDEO:
        message_content = message.video.file_id
    elif message_type == ContentType.DOCUMENT:
        message_content = message.document.file_id
    else:
        message_content = f"[{message_type}]"

    ticket_id = await db.add_ticket(user_id, message_type, message_content)

    for admin_id in ADMIN_IDS:
        try:
            keyboard = get_ticket_actions(ticket_id, user_id)
            if not keyboard.inline_keyboard:
                logger.error(f"Пустая клавиатура для заявки #{ticket_id}, пользователь {user_id}")
                keyboard = None

            if message_type == ContentType.TEXT:
                await message.bot.send_message(
                    admin_id,
                    f"Новая заявка #{ticket_id} от {username} (ID: {user_id}):\n{message_content}",
                    reply_markup=keyboard
                )
            elif message_type == ContentType.PHOTO:
                await message.bot.send_photo(
                    admin_id,
                    message_content,
                    caption=f"Новая заявка #{ticket_id} от {username} (ID: {user_id})",
                    reply_markup=keyboard
                )
            elif message_type == ContentType.VIDEO:
                await message.bot.send_video(
                    admin_id,
                    message_content,
                    caption=f"Новая заявка #{ticket_id} от {username} (ID: {user_id})",
                    reply_markup=keyboard
                )
            elif message_type == ContentType.DOCUMENT:
                await message.bot.send_document(
                    admin_id,
                    message_content,
                    caption=f"Новая заявка #{ticket_id} от {username} (ID: {user_id})",
                    reply_markup=keyboard
                )
            else:
                await message.bot.send_message(
                    admin_id,
                    f"Новая заявка пользователя {user_id}: [Неподдерживаемый формат]",
                    reply_markup=keyboard
                )
            logger.debug(f"Уведомление о заявке #{ticket_id} отправлено админу {admin_id}")
        except Exception as e:
            logger.error(f"Ошибка отправки сообщения админу {admin_id}: {e}")

    await message.answer("Сообщение отправлено в поддержку. Ожидайте ответа.")