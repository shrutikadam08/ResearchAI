from app.schemas.user import UserCreate

user=UserCreate(
    full_name="Shruti Kadam",
    email="shruti@gmail.com",
    password="shruti123"
)

print("Schema validation successful")
print(user)