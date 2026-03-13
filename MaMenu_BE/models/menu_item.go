package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MenuItem struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	HotelID     primitive.ObjectID `bson:"hotel_id" json:"hotel_id"`
	CategoryID  primitive.ObjectID `bson:"category_id" json:"category_id"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description" json:"description"`
	Price       float64            `bson:"price" json:"price"`
	ImageURL    string             `bson:"image_url" json:"image_url"`
	IsVeg       bool               `bson:"is_veg" json:"is_veg"`
	IsAvailable bool               `bson:"is_available" json:"is_available"`
	Tags        []string           `bson:"tags,omitempty" json:"tags,omitempty"`
	SortOrder   int                `bson:"sort_order" json:"sort_order"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}
