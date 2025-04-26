from rest_framework import serializers
from .models import AuditLog
from django.apps import apps

class AuditLogSerializer(serializers.ModelSerializer):
    ip_address = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(format='%d.%m.%Y')

    class Meta:
        model = AuditLog
        fields = ['action', 'details', 'timestamp', 'ip_address']

    def get_ip_address(self, obj):
        details = obj.details or ''
        if 'с IP' in details:
            return details.split('с IP ')[-1]
        return 'Unknown'

class UserProfileSerializer(serializers.ModelSerializer):
    audit_logs = AuditLogSerializer(many=True, source='audit_logs_set')
    date_of_birth = serializers.DateField(format='%d.%m.%Y')

    class Meta:
        model = apps.get_model('Auth', 'CustomUser')
        fields = ['username', 'date_of_birth', 'country', 'audit_logs']