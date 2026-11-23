import sys
import os

# Adiciona o diretório atual ao path do Python
sys.path.insert(0, os.path.dirname(__file__))

# Importa a aplicação Flask
from app import app as application
