package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Table struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	HotelID    primitive.ObjectID `bson:"hotel_id" json:"hotel_id"`
	Number     int                `bson:"number" json:"number"`
	Label      string             `bson:"label" json:"label"`
	Capacity   int                `bson:"capacity" json:"capacity"`
	QRCode     string             `bson:"qr_code" json:"qr_code"`
	IsActive   bool               `bson:"is_active" json:"is_active"`
	IsOccupied bool               `bson:"is_occupied" json:"is_occupied"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time          `bson:"updated_at" json:"updated_at"`
}
