# Delete the certs directory if it exists
if [ -d "./certs" ]; then
    rm -rf ./certs
fi

# Create the certs directory
mkdir -p ./certs

# Generate a new private key
openssl genpkey -algorithm RSA -out ./certs/key.pem -pkeyopt rsa_keygen_bits:2048

# Generate a self-signed certificate with default values
openssl req -new -x509 -key ./certs/key.pem -out ./certs/cert.pem -days 365 \
-subj "/C=IE/ST=Dublin/L=Dublin/O=Gigs Ireland/OU=IT Department/CN=www.gigsireland.ie"