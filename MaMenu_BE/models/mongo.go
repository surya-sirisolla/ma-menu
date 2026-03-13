package models

type MongoDBConfig struct {
	AuthEnabled        bool   `bson:"auth_enabled" json:"auth_enabled" yaml:"auth_enabled" required:"true"`
	Ip                 string `bson:"ip" json:"ip" yaml:"ip" required:"true"`
	Port               string `bson:"port" json:"port" yaml:"port" required:"true"`
	Username           string `bson:"username" json:"username" yaml:"username" required:"true"`
	Password           string `bson:"password" json:"password" yaml:"password" required:"true"`
	Atlas              string `bson:"atlas" json:"atlas" yaml:"atlas" required:"true"`
	Collection         string `bson:"collection" json:"collection" yaml:"collection" required:"true"`
	Database           string `bson:"database" json:"database" yaml:"database" required:"true"`
	ConnectionType     string `bson:"connection_type" json:"connection_type" yaml:"connection_type" required:"true"`
	Timeout            int    `bson:"timeout" json:"timeout" yaml:"timeout" required:"true"`
	AuthMechanism      string `bson:"auth_mechanism" json:"auth_mechanism" yaml:"auth_mechanism" required:"true"`
	ConnectTimeout     int    `bson:"connect_timeout" json:"connect_timeout" yaml:"connect_timeout" required:"true"`
	MaxConnIdleTimeout int    `bson:"max_conn_idle_timeout" json:"max_conn_idle_timeout" yaml:"max_conn_idle_timeout" required:"true"`
	MaxPoolSize        uint64 `bson:"max_pool_size" json:"max_pool_size" yaml:"max_pool_size" required:"true"`
	ReadRetry          bool   `bson:"read_retry" json:"read_retry" yaml:"read_retry" required:"true"`
	WriteRetry         bool   `bson:"write_retry" json:"write_retry" yaml:"write_retry" required:"true"`
	RemoteConfigName   string `bson:"remote_config_name" json:"remote_config_name" yaml:"remote_config_name" required:"true"`
	ColDet             string `bson:"col_details" json:"col_details" yaml:"col_details" required:"true"`
}
