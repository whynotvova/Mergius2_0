from django.http import JsonResponse


def home_view(request):
    return JsonResponse({'message': 'API is working'})


def login_view(request):
    return JsonResponse({'message': 'Login API'})


def register_view(request):
    return JsonResponse({'message': 'Register API'})


def confirm_auth(request):
    return JsonResponse({'message': 'Confirm auth API'})


def confirm_reg(request):
    return JsonResponse({'message': 'Confirm reg API'})


def register_final_view(request):
    return JsonResponse({'message': 'Register final API'})


def mail_view(request):
    return JsonResponse({'message': 'Mail API'})
