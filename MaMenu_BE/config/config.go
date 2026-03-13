package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port      string
	MongoURI  string
	DBName    string
	JWTSecret string
}

var AppConfig Config

func LoadConfig() {

	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}

	AppConfig = Config{
		Port:      os.Getenv("PORT"),
		MongoURI:  os.Getenv("MONGO_URI"),
		DBName:    os.Getenv("DB_NAME"),
		JWTSecret: os.Getenv("JWT_SECRET"),
	}
}
