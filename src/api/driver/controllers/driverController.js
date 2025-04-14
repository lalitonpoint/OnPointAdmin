const DriverProfile = require("../modals/driverModal");

const createProfile = async (req, res) => {
    try {
        const data = req.body;

        const driver = new DriverProfile({
            personalInfo: {
                name: data.name,
                email: data.email,
                dob: data.dob,
                gender: data.gender,
                mobile1: data.mobile1,
                mobile2: data.mobile2,
                whatsapp: data.whatsapp
            },
            addressInfo: {
                permanent: {
                    street: data.permanentStreet,
                    city: data.permanentCity,
                    state: data.permanentState,
                    pin: data.permanentPin
                },
                current: {
                    street: data.currentStreet,
                    city: data.currentCity,
                    state: data.currentState,
                    pin: data.currentPin
                }
            },
            emergencyContact: {
                name: data.emergencyName,
                relationship: data.emergencyRelation,
                contactNumber: data.emergencyNumber
            },
            documents: {
                aadhaarFront: data.aadhaarFront,
                aadhaarBack: data.aadhaarBack,
                panCard: data.panCard,
                drivingLicense: data.drivingLicense,
                vehicleRC: data.vehicleRC,
                insuranceCopy: data.insuranceCopy,
                bankPassbook: data.bankPassbook
            },
            additionalInfo: {
                logisticsExperience: data.logisticsExperience,
                preferredRegion: data.preferredRegion,
                languages: data.languages, // should be an array
                nightShift: data.nightShift
            }
        });

        await driver.save();
        res.status(201).json({ success: true, message: "Driver profile created successfully", driver });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

module.exports = { createProfile };
