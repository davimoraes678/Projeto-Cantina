# app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_required, login_user

db = SQLAlchemy()
lm = LoginManager()