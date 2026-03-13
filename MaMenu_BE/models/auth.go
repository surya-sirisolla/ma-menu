package models

type Login struct {
	UserId   string `json:"userId"`
	Password string `json:"password"`
}
