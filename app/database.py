from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine


DATABASE_URL= "mysql+pymysql://root:1234@localhost:3306/db_restaurante"

engine =create_engine(DATABASE_URL, echo=True)


SessionLocal =sessionmaker(autocommit=False, autoflush=False, bind=engine)
# (Session maker)=Este es un genereador de sesiones, que cuando se llama se obtine la clase de Sesion (Session local)
# Cancela el autocommit para que los cambios en la base de datos solo se hagan cuando hacemos un commit 
#  El auto fluch evita que los modelos se sincronicen automaticamente con la base de datos
#  
Base = declarative_base() #Esta es una clase que le dice a SQLALCHEMY como covertir los datos de
                          #python a la base de datos, como si se pasara con un diccionario, esta la heredan los modelos.

def get_db():
  db=SessionLocal()   #Aqui se crea una nueva sesion db.
  try:
    yield db          #Aqui le entrega la sesion al codigo que la llamo, el yield permite que el codigo que la llamo use la sesion y la devuelva cuando termine, para que el fujo de ejecucion regrese a esta funcion.
  finally:
    db.close()         # sin importar lo que pase, si hay error o no la secion se cierra, para liberar la conexion a la base de datos y aseguran que los recursos no se agoten y la aplicacion no se bloquee

