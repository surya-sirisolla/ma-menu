package database

import (
	"mamenu/models"
	"mamenu/pkg/logger"
	"mamenu/pkg/storage/mongodb"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Idatabase interface {
	// users
	GetUserById(database, collection string, filter bson.M) (*models.User, error)
	CreateUser(database, collection string, user models.User) (*models.User, error)
	GetAllUsers(database, collection string, filter bson.M) ([]*models.User, error)
	UpdateUser(database, collection string, id primitive.ObjectID, data bson.M) error

	// hotels
	CreateHotel(database, collection string, hotel models.Hotel) (*models.Hotel, error)
	GetAllHotels(database, collection string, filter bson.M) ([]*models.Hotel, error)
	GetHotelByID(database, collection string, id primitive.ObjectID) (*models.Hotel, error)
	AddHotelToOwner(database, collection string, ownerID, hotelID primitive.ObjectID) error
	UpdateHotel(database, collection string, id primitive.ObjectID, data bson.M) error

	// tables
	CreateTable(database, collection string, t models.Table) (*models.Table, error)
	GetTablesByHotel(database, collection string, hotelID primitive.ObjectID) ([]*models.Table, error)
	UpdateTable(database, collection string, id primitive.ObjectID, data bson.M) error
	UpdateTableByFilter(database, collection string, filter bson.M, data bson.M) error

	// categories
	CreateCategory(database, collection string, c models.Category) (*models.Category, error)
	GetCategoriesByHotel(database, collection string, hotelID primitive.ObjectID) ([]*models.Category, error)
	UpdateCategory(database, collection string, id primitive.ObjectID, data bson.M) error

	// menu items
	CreateMenuItem(database, collection string, m models.MenuItem) (*models.MenuItem, error)
	GetMenuItemsByHotel(database, collection string, filter bson.M) ([]*models.MenuItem, error)
	UpdateMenuItem(database, collection string, id primitive.ObjectID, data bson.M) error

	// orders
	CreateOrder(database, collection string, o models.Order) (*models.Order, error)
	GetOrdersByHotel(database, collection string, filter bson.M) ([]*models.Order, error)
	GetOrderByID(database, collection string, id primitive.ObjectID) (*models.Order, error)
	UpdateOrderStatus(database, collection string, id primitive.ObjectID, data bson.M) error
}

type database struct {
	mongo  *mongodb.MongoHandler
	logger *logger.LoggerHandler
}

func NewDatabase(mongo *mongodb.MongoHandler, logger *logger.LoggerHandler) *database {
	return &database{
		mongo:  mongo,
		logger: logger,
	}
}
