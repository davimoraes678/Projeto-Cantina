from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

# Criados uma única vez aqui; o app.py liga os dois ao Flask (init_app).
db = SQLAlchemy()
lm = LoginManager()
