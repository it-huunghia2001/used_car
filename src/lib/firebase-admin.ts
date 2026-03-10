import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "tbd-used-car",
      clientEmail:
        "firebase-adminsdk-fbsvc@tbd-used-car.iam.gserviceaccount.com",
      // Lưu ý: Thay đổi dấu xuống dòng trong Private Key
      privateKey:
        "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDARubyD1vFnx3v\nkLEeyvoPmB5HIwzB1DEWmvTjUDKuWtzknUfkFg/x76KTe/6hGEip1nzJoPjlnAh8\nDN8Y1WeF83vy0NLFiycoY3nX+iTJuyVD0Zf7E9NGRRx07zc9ny4bJfEZlG6OdEEo\nPdkoQmtuORLkGShGO75+JB7JS1J4otyM8kdyflI7EQ8xjN5qYvGnN4BMFegM5Blo\nEyd57nTFVV/N4yVlVm7E6gRNZv+ihR5H0+EQVRNtuuWUJL4LxvjlFMNxv2yv7YXu\nEqKrMXwVPdaq+vCoFzbQeH5HSuFBpZ/moiFoCyXyi4QyCv5fnfXf4d/ZTk+kuVEB\nJnsde5L9AgMBAAECggEAId97yRIGl1qQQgeKBIQ6qGuijeKxWSZCHZrf4Hnc69Vr\nC8VfiGGQno0aZYQXGBc4md8E7dpzbrPd1MjJtszFp5X89IpwT0fT9qwLp45UU8up\n5Xgzn5JfCoabXEhWQX9c9oBpKJn7HhKB9g5rRsnotirM1q1N6I2W4g8H82tXFJRC\nG4lKvz6rVco3pbfCcHNBd05J5R3V1QuMh+FJE6FWdi745zu+H56yvFcA1qYWEBOc\ngWBVsEPGv7rhoNnsdDtxBbT1HdGDQHhwZxoRCs/v2HVPOi/01MG3Qt3oRyjabwie\nBKKuu9vrz9/4zud5Neoe28k41oXpQZkUKZh2hoJVkQKBgQDrNKt1PReMX1Y8NwwA\n7h2AfZGjVSjWYwB0Uw1EvR8oVPhtUXmSQjTsoHZjlH0psTO2dC5yMpTa9hVJ5dKi\nwltpv2J0h+jpxbNXxF7uTkJXxNhgjKvZPtRELaqthPjfrfh0oGBWVJAIqoDzZ+T6\nk36mTKdsmslNYNf7QdnYzHnBhQKBgQDRRqPgIeyY29yVicb2SuMpVNi8JoEnSPvx\n5w0SHME9IL2kcWwguhQYyS6FcivziklgiDSl4CV2fEoO8V8EAzu/jEUZLoneTUrp\nq03+PyJH3COdOIZNWoxwtenZpiV905m42Cbd7B7Ca590RELFVo2Pi/Qol8h5u9zc\nfVTbi8IJGQKBgQCw3yusfyNtMOhFYdPKA0X2MPdLDyglh894qlfJADsk9jjW5DT6\nsoTgCI7etXQl3RaZNucSg00DF5jMuGHceTGK5Rvhq66P1VbXQlls9TbYj7Nzb3Vv\nadrv5jN6RwtsEYRMF6o6YV7q1WUhJVjAwhe0cOJaPk/wu0nPrSZn7OQGjQKBgQCj\nmlfOhnbSYT8m4FjcflrsGtp87JUXQyVDTV+Yg0ZGJWxcPBdN1mqTneNyi3j0oW0P\nvCt8aaif4jZ7TBL9rhFtg5kZQJqjYUVpO3RziKOiDeUBqgjEPD+CdZRlhE/W+C86\npDBuWYMKdtxnJl4Uq79rMvwjJ9Wf5U+aR5ipMa71MQKBgAGdAgGmJzlstYE2udzx\nI45ELZcrMI2iu7ZLwgyLWG0XTPrSlGcIxoKdiTj+0lZZcdklAd/egVehkaelgYNk\nK70j4mZZMs5GfLUja8ciM84krz3RpqarPvm7x1BcLICYQhTIXTbtokqNT4ZpFlxC\n7/g2Rey+VVf0I1GTKBVpd27z\n-----END PRIVATE KEY-----\n".replace(
          /\\n/g,
          "\n",
        ),
    }),
  });
}

export const adminMessaging = admin.messaging();
