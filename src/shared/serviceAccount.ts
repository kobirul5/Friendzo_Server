
// export const serviceAccount = {
//   "type": "service_account",
//   "project_id": "korian-c5b66",
//   "private_key_id": "d6f31d04703a5d6d37bc1c9a6b9b44d54a59d6dd",
//   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCkEuEqJpazHy6v\niYKUPa76NKcUSamkExf3HIdLLX9mQBl0a9ePZOpE0f25jwlZm7IAuBk2+E4wC16G\np3TAlN+xx/N8MJE7OrVkvnSDDp9HS2ewn5CcBmMgM7WJhgSudEGHitePEgfOfd0T\nyQb9DgjQrDhthQTMlttY5p6JbUcv7TdgBID7ReUDRstRm9rkTtSzAh3ieNWboQeC\nrQA5vtEc36O5aMjdJxkLAYH8HO0cM+y/nX9z56G7Nb03XZInfrHm1vMQsvwXRX4k\nrpDCseP/XLYiyBwpWjWP8GK+jHYhzOKeHmxbBBm27UdOoVDMDsjPFFM3h1lP2tcZ\nVnsm1WllAgMBAAECggEABc+JW+XL9oIHND5JepiIpuHQfP5y3JW0hpLjE72DwopI\nnH/pPXHUfiV1t+mh6iOCdVYPxouasUblzR0HHH7pQTGUpPRPYGqe2/eGxtFwwKSi\nAnZUN8JeJljOeBVf+xGw9GztX2rDDgQVHUtETRf/JezDftV0Kw64q/hW6wUMvVy5\nwq54E5GkkG8BuIxA6uoK/WjRuFdjNXEptrV8JVUMmoqJaAysaHkLE0qtKFWNRJhC\ngHihrGrhGuw9JH11cY8+9ukaMeIzpd4vYWi96RkdHE13/8lHD528XINVtg3iEOSA\n3IzbgWKI/Rh7Fp/jJcwMTVXGuNANgShgG9WzzmijLQKBgQDgeI/uEk4Mfp3d8D5L\nrN8n3b7VmJCxCVmqCVBBPvAkx36djQWk9ce4ffJ3oCRVRtM+mnNuVznm0FkCEl8g\nuzLxo+Azzz4Ti8vIlSTeNHXvtCNSKpBKfB9oSgTGz0sl94Mab/AlSjIIusU3a/OA\nv8yo+r8VYixf0HpfBZ7voD2FIwKBgQC7HpQlRTUoCLupJ8sIhmnXBurrgs7vNNDj\nf9kRK947byxOy21Y8M7wAsX5X0/h06o85ke4ibOg6LqIG1TsZwkvF9SLFi0oEYFK\n1nIPAJwcSSzIiFiYHPu22vcqZVFnPff37uawQzjSfLYayxP5HQB8jBRhZPy+6A/s\nMmaEH6MT1wKBgQCN0B0+Txo4EpYx7OGudZzWVuWFlEl1T27yWcf2MIkO82oupzV1\nrkFrcUaKBQZvSbuTxYg/oaPXCrHw+SJYT2wz9VBj6v5Q4vTv2CneqE4KDkhyVKms\nJRbCkGDMKZJUfja5sRaKuIE7uqN2DCFeqc3mw+OM4uUd81wcRDTRNu8m+QKBgQCW\nSDHdWR8fHxxw99e16hY5L4IfUjiWn4mhHX4dr2jVvS0Nv43737OjyeZsqOMEUTYp\noR07FcUh16hwRdtH3lze6Lm4V0A/LQf1LhP+/pNimFaSXAcjbCuxqVzXPPZK/9cW\n1lWKfQK28phjHnTVHzjTzsFTk4L2ZHTdU4FIXgxgkwKBgEGlxIGdGjFqds6sa6jS\nKEiu1XLxinGUf89/R92TM33l1V6q6xAnW8XNCw2nJaxPJFIaoUxDK9iLrwt4MwSZ\nlC3p6Gn9e0k7JMC5tm5AyPF4IG5lxl5YuFj1vX1BDFVHAil0daX6uh9xRIRXXow2\n3FsYYKP0qRg6SODqqZBdUpM1\n-----END PRIVATE KEY-----\n",
//   "client_email": "firebase-adminsdk-fbsvc@korian-c5b66.iam.gserviceaccount.com",
//   "client_id": "115404344608258104872",
//   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//   "token_uri": "https://oauth2.googleapis.com/token",
//   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40korian-c5b66.iam.gserviceaccount.com",
//   "universe_domain": "googleapis.com"
// };
export const serviceAccount = {
  "type": "service_account",
  "project_id": "maskanrestate-2025",
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY,
  // "private_key_id": "247ce9a2f5a22237d752495ea576cf7dc7cad78c",
  // "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCiRzYqMs1ArQAd\ndqkuVkL/bUgh3iemS/qoIr1bAfZB4oQqRzMnkGzTcZvU6speurwFQ5uNk2JamdKK\nX6uM3fFJfAw2ufVgWwk+MF3RzoXcHC2A4LW2d2Q2+eR5EymlbzYv0u6akBrPuBkt\nKJelCQE9PvrfRw0TTECvRh7esGxJVbNokQWji77vUo3kOUbpwVyoEEyaAqgtIzs8\nR03ziQAYhRbCoPmOFJyQnCCykZ2MIc/y5csXwV36Vsz8g2FpZmmlkUp2TMa1170U\n+Bty4wTvw8OYonkyG5HeZmWvFTSUkyRGvUlSFjmsFbVDt03f8maP7CyJ7TlRjC1K\n+3ZzjjG5AgMBAAECggEABZxkuQzMoAHbUSl7LAj7hA1pQxKFWHCkGBArb+wfcaO9\nYiDYGfQaby0scC42FRRrz9rIlBqWef97kiFAszwxTZMmcPX5D/3V0fqmI8z6P+QR\nhrU+UzLJmkUFq1IITJoNy5WFfn6hDrGU3UTcCW7IRi/ZSMMSJqqqSeUoyBZdiCOK\nVQ80PGDQcuK5XIg1wrs84xeNEJ1tlUTx0+v4/dHnF0//YgwEjnkNsW/aVcGAfmiS\nQTSfgB/Bmnccax/evTiczol4JRN48CQwWv3uWKETxBMTNsY6+dgvRkoTvJulF5mx\nBV14veNC4od7weV/9HEmU3C+q/42gTMyhi/cRGMdyQKBgQDXBpalShSBoXrdRgdf\neV7de8xVE4BLl7wYWvTfYskU+SetoOWUR9Z+zLHr6smkkXw/luVUUeRPjUNbvDDi\nTTbZ02jegBfAxA/+ZNpQxQ6kLs88ZvfKEQXp257U1d1+A9kyxQnw4ast3TR808Gd\neR3pqzATRFv+CXthvKqJ4uaJNwKBgQDBM3wmjcRrqFDFQ2l0Ux/ijZmVceRmrCoB\nkVvRje/xT9Ily0LljtD22MDiIJjyb8s48UE7Q5Mzrr8QSujElDzjvngayNWr1aKi\nFcLPInv8wRYMhVSgNUnzMsECpjkaS0WCckfIIVXyEtlHpV4YHmbQ4Tl81PHhpWqH\nKbm2iQrUjwKBgCh23/CZAUTny4RKgmawI28QtgIomlMfadE3hK9pGqgsvw/IoIuH\n/VB9Wtono+ypSDV7QwrcIlfqIIvp3VUo7LKPO0Pr3Qx0mQHpnr/mZXv2Jx+ZzPWk\nwHUi1D//QyBMvxnzxIwlG56U6yS2gNAOk9d+VJy7l4g15pcc9wbdwT5/AoGBAJrK\nAA73iEZk3Qmev++F5cbigglc7YxhJWqKJlFXccUZmZnUJy26ZatP8AF78m5SqTRe\n/k9YDajbuZJ5IdLVnY8t/BYhkCeTCzDnVGQWEdZocJzpeeq9pxjlMgRIXvm1EuS3\nYNFz++LtvQ2M7T1Ppjp2KFPeXEjX+eh+wp7/XyD7AoGBAKTr/Ai7M4iGDxBoRVau\nsJLbl08xp7LmFjFo+tSCoK5bGZUTapTUwpfV0nZ8dJPMZMAADfEuc8OCnyBAqHFl\nQxTc0fRmax3jS+4cgpp+FT5kNFFIbhLiRZIgDKVqPrYdOO5GBdAmOKe/nkXCAL+S\nDgEN+v80f4IGpUjacM/OYHLr\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@maskanrestate-2025.iam.gserviceaccount.com",
  "client_id": "100805836220396666830",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40maskanrestate-2025.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
;