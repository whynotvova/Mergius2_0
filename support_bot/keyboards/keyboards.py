from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

def get_admin_panel():
    keyboard = InlineKeyboardMarkup(row_width=2, inline_keyboard=[
        [
            InlineKeyboardButton(text="📊 Статистика", callback_data="admin_stats"),
            InlineKeyboardButton(text="👥 Пользователи", callback_data="admin_users")
        ],
        [
            InlineKeyboardButton(text="📬 Рассылка", callback_data="admin_broadcast"),
            InlineKeyboardButton(text="📥 Неотвеченные заявки", callback_data="admin_tickets")
        ],
        [
            InlineKeyboardButton(text="🌐 Проверка сайта", callback_data="check_site")
        ]
    ])
    return keyboard

def get_users_list(users):
    keyboard = InlineKeyboardMarkup(row_width=1, inline_keyboard=[
        [
            InlineKeyboardButton(
                text=f"{user['username'] or 'No Username'} (ID: {user['user_id']})",
                callback_data=f"user_{user['user_id']}"
            )
        ] for user in users
    ] + [[InlineKeyboardButton(text="🔙 Назад", callback_data="admin_panel")]])
    return keyboard

def get_user_actions(user_id):
    keyboard = InlineKeyboardMarkup(row_width=2, inline_keyboard=[
        [
            InlineKeyboardButton(text="Изменить тариф", callback_data=f"change_tariff_{user_id}"),
            InlineKeyboardButton(text="🔙 Назад", callback_data="admin_users")
        ]
    ])
    return keyboard

def get_tariff_keyboard(user_id):
    keyboard = InlineKeyboardMarkup(row_width=2, inline_keyboard=[
        [
            InlineKeyboardButton(text="Персональный", callback_data=f"set_tariff_{user_id}_1"),
            InlineKeyboardButton(text="Премиум", callback_data=f"set_tariff_{user_id}_2")
        ],
        [InlineKeyboardButton(text="🔙 Назад", callback_data=f"user_{user_id}")]
    ])
    return keyboard

def get_ticket_actions(ticket_id, user_id):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Ответить", callback_data=f"reply_ticket_{ticket_id}_{user_id}")]
    ])
    return keyboard

def get_unanswered_tickets_keyboard(tickets):
    keyboard = InlineKeyboardMarkup(row_width=1, inline_keyboard=[
        [
            InlineKeyboardButton(
                text=f"Заявка #{ticket['ticket_id']} от ID {ticket['user_id']}",
                callback_data=f"reply_ticket_{ticket['ticket_id']}_{ticket['user_id']}"
            )
        ] for ticket in tickets
    ] + [[InlineKeyboardButton(text="🔙 Назад", callback_data="admin_panel")]])
    return keyboard