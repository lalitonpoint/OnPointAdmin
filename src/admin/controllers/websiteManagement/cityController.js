const fs = require('fs');
const csv = require('csv-parser');
const City = require('../../models/websiteManagement/cityModal');

const importCSV = async () => {
    const cities = [];

    fs.createReadStream("C:/Users/Appsquadz/Downloads/Book1 1(Sheet1).csv")
        .pipe(csv())
        .on('data', (row) => {
            if (row.City && row.City.trim() !== '') {
                cities.push(row.City.trim());
            }
        })
        .on('end', async () => {
            try {
                // Remove duplicates within CSV itself
                const uniqueCities = [...new Set(cities)];

                const existingCities = await City.find({
                    name: { $in: uniqueCities }
                }).select('name');

                const existingCityNames = existingCities.map(city => city.name);

                // Filter out cities already in DB
                const newCities = uniqueCities
                    .filter(cityName => !existingCityNames.includes(cityName))
                    .map(cityName => ({ name: cityName }));

                if (newCities.length > 0) {
                    await City.insertMany(newCities);
                    console.log(`${newCities.length} new cities inserted successfully!`);
                } else {
                    console.log('No new cities to insert (all duplicates).');
                }
            } catch (err) {
                console.error('Insert error:', err);
            }
        });
};

const getCities = async (req, res) => {

    try {
        const cities = await City.find({}).sort({ name: 1 }); // Alphabetical
        res.status(200).json({
            success: true,
            message: 'City list fetched successfully.',
            data: cities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Something went wrong while fetching cities.',
            error: error.message
        });
    }
}


const addCities = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "City name is required."
            });
        }

        // Check for existing city (case-insensitive)
        const existing = await City.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
        if (existing) {
            return res.status(200).json({
                success: false,
                message: "City already exists."
            });
        }

        const newCity = new City({ name: name.trim() });
        await newCity.save();

        res.status(201).json({
            success: true,
            message: "City added successfully.",
            data: newCity
        });

    } catch (err) {
        console.error("Add City Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: err.message
        });
    }
};

module.exports = { importCSV, getCities, addCities };
