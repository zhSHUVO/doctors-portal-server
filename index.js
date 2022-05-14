const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pntmr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
        await client.connect();
        const servicesCollection = client
            .db("doctors_portal")
            .collection("services");
        const bookingCollection = client
            .db("doctors_portal")
            .collection("bookings");

        app.get("/services", async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get("/available", async (req, res) => {
            const date = req.query.date;

            // get all services
            const services = await servicesCollection.find().toArray();
            // get booking of that day
            const query = { date: date };
            const booking = await bookingCollection.find(query).toArray();
            // for each service, find booking of that service
            services.forEach((service) => {
                // step 4: find bookings for that service. output: [{}, {}, {}, {}]
                const serviceBookings = booking.filter(
                    (book) => book.treatment === service.name
                );
                // step 5: select slots for the service Bookings: ['', '', '', '']
                const bookedSlots = serviceBookings.map((book) => book.slot);
                // step 6: select those slots that are not in bookedSlots
                const available = service.slots.filter(
                    (slot) => !bookedSlots.includes(slot)
                );
                //step 7: set available to slots to make it easier
                service.slots = available;
            });

            res.send(services);
        });

        app.get("/booking", async (req, res) => {
            const patient = req.query.patient;
            const query = { patient: patient };
            const booking = await bookingCollection.find(query).toArray();
            res.send(booking);
        });

        app.post("/bookings", async (req, res) => {
            const booking = req.body;
            const query = {
                treatment: booking.treatment,
                date: booking.date,
                patient: booking.patient,
            };
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists });
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result });
        });
    } finally {
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Doctor's portal is listening on port ${port}`);
});
