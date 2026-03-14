package main

import (
	"mamenu/components/router"
	adminsvc "mamenu/components/services/admin"
	authsvc "mamenu/components/services/auth"
	hotelownersvc "mamenu/components/services/hotelowner"
	"mamenu/config"
	"mamenu/pkg/logger"
	"mamenu/pkg/storage/database"
	"mamenu/pkg/storage/mongodb"
	"mamenu/pkg/ws"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {

	// Load .env if present; in Docker, env vars are passed directly
	_ = godotenv.Load()

	// LOGGER
	logImpl := logger.NewLogger()
	logHandler := logger.NewLoggerHandler(logImpl)
	err := logHandler.SetupLogger()
	if err != nil {
		panic(err)
	}
	logHandler.WriteLog(logger.InfoLog, "Logger initialized")

	// MONGO
	mongoImpl := mongodb.NewMongoDB(logHandler)
	mongoHandler := mongodb.NewMongoHandler(mongoImpl, logHandler)
	mongoHandler.SetupClient()

	// DATABASE
	databaseImpl := database.NewDatabase(mongoHandler, logHandler)
	databaseHandler := database.NewDatabaseHandler(databaseImpl)

	// CONFIG
	config.LoadConfig()

	// WEBSOCKET HUB
	hub := ws.NewHub()

	// SERVICES
	authImpl := authsvc.NewAuth(databaseHandler, logHandler)
	authHandler := authsvc.NewAuthHandler(authImpl)

	adminImpl := adminsvc.NewAdmin(databaseHandler, logHandler)
	adminHandler := adminsvc.NewAdminHandler(adminImpl)

	hotelownerImpl := hotelownersvc.NewHotelOwner(databaseHandler, logHandler, hub)
	hotelownerHandler := hotelownersvc.NewHotelOwnerHandler(hotelownerImpl)

	// ROUTER
	engine := gin.Default()
	r := router.NewGinRouter(engine, authHandler, adminHandler, hotelownerHandler)
	r.RegisterEndpoints()

	engine.Run(":" + config.AppConfig.Port)
}
