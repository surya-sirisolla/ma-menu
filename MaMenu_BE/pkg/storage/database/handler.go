package database

import (
	"mamenu/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	dbName               = "Internal"
	usersCollection      = "Users"
	hotelsCollection     = "Hotels"
	tablesCollection     = "Tables"
	categoriesCollection = "Categories"
	menuItemsCollection  = "MenuItems"
	ordersCollection     = "Orders"
)

type DatabaseHandler struct {
	database Idatabase
}

func NewDatabaseHandler(database Idatabase) *DatabaseHandler {
	return &DatabaseHandler{database: database}
}

// ---- Users ----

func (dh *DatabaseHandler) GetUser(filter bson.M) (*models.User, error) {
	return dh.database.GetUserById(dbName, usersCollection, filter)
}

func (dh *DatabaseHandler) CreateHotelOwner(user models.User) (*models.User, error) {
	return dh.database.CreateUser(dbName, usersCollection, user)
}

func (dh *DatabaseHandler) GetHotelOwners() ([]*models.User, error) {
	return dh.database.GetAllUsers(dbName, usersCollection, bson.M{"role": models.RoleHotelAdmin})
}

// ---- Hotels ----

func (dh *DatabaseHandler) CreateHotel(hotel models.Hotel) (*models.Hotel, error) {
	return dh.database.CreateHotel(dbName, hotelsCollection, hotel)
}

func (dh *DatabaseHandler) GetHotels() ([]*models.Hotel, error) {
	return dh.database.GetAllHotels(dbName, hotelsCollection, bson.M{})
}

func (dh *DatabaseHandler) GetHotelByID(id primitive.ObjectID) (*models.Hotel, error) {
	return dh.database.GetHotelByID(dbName, hotelsCollection, id)
}

func (dh *DatabaseHandler) AddHotelToOwner(ownerID, hotelID primitive.ObjectID) error {
	return dh.database.AddHotelToOwner(dbName, usersCollection, ownerID, hotelID)
}

// ---- Tables ----

func (dh *DatabaseHandler) CreateTable(t models.Table) (*models.Table, error) {
	return dh.database.CreateTable(dbName, tablesCollection, t)
}

func (dh *DatabaseHandler) GetTablesByHotel(hotelID primitive.ObjectID) ([]*models.Table, error) {
	return dh.database.GetTablesByHotel(dbName, tablesCollection, hotelID)
}

func (dh *DatabaseHandler) UpdateTable(id primitive.ObjectID, data bson.M) error {
	return dh.database.UpdateTable(dbName, tablesCollection, id, data)
}

// ---- Categories ----

func (dh *DatabaseHandler) CreateCategory(c models.Category) (*models.Category, error) {
	return dh.database.CreateCategory(dbName, categoriesCollection, c)
}

func (dh *DatabaseHandler) GetCategoriesByHotel(hotelID primitive.ObjectID) ([]*models.Category, error) {
	return dh.database.GetCategoriesByHotel(dbName, categoriesCollection, hotelID)
}

func (dh *DatabaseHandler) UpdateCategory(id primitive.ObjectID, data bson.M) error {
	return dh.database.UpdateCategory(dbName, categoriesCollection, id, data)
}

// ---- Menu Items ----

func (dh *DatabaseHandler) CreateMenuItem(m models.MenuItem) (*models.MenuItem, error) {
	return dh.database.CreateMenuItem(dbName, menuItemsCollection, m)
}

func (dh *DatabaseHandler) GetMenuItemsByHotel(filter bson.M) ([]*models.MenuItem, error) {
	return dh.database.GetMenuItemsByHotel(dbName, menuItemsCollection, filter)
}

func (dh *DatabaseHandler) UpdateMenuItem(id primitive.ObjectID, data bson.M) error {
	return dh.database.UpdateMenuItem(dbName, menuItemsCollection, id, data)
}

// ---- Orders ----

func (dh *DatabaseHandler) CreateOrder(o models.Order) (*models.Order, error) {
	return dh.database.CreateOrder(dbName, ordersCollection, o)
}

func (dh *DatabaseHandler) GetOrdersByHotel(filter bson.M) ([]*models.Order, error) {
	return dh.database.GetOrdersByHotel(dbName, ordersCollection, filter)
}

func (dh *DatabaseHandler) GetOrderByID(id primitive.ObjectID) (*models.Order, error) {
	return dh.database.GetOrderByID(dbName, ordersCollection, id)
}

func (dh *DatabaseHandler) UpdateOrderStatus(id primitive.ObjectID, data bson.M) error {
	return dh.database.UpdateOrderStatus(dbName, ordersCollection, id, data)
}
