"""Data e hora do sistema: tudo é guardado em UTC."""
from datetime import datetime, timezone


def agora_utc():
    """Hora atual em UTC. É o valor padrão das colunas de data (no lugar do `utcnow`, deprecado)."""
    return datetime.now(timezone.utc)
