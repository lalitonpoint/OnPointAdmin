const DriverProfile = require("../modals/driverModal");

const createProfile = async (req, res) => {
    try {
        const data = req.body;

        // Required field validation
        const requiredFields = [
            "name", "email", "dob", "gender", "mobile1",
            "permanentStreet", "permanentCity", "permanentState", "permanentPin",
            "aadhaarFront", "aadhaarBack", "panCard", "drivingLicense"
        ];

        const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === "");

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`
            });
        }

        // Check if email is already registered
        const emailExists = await DriverProfile.findOne({ "personalInfo.email": data.email });
        if (emailExists) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        // Check if mobile number is already registered
        const mobileExists = await DriverProfile.findOne({ "personalInfo.mobile": data.mobile1 });
        if (mobileExists) {
            return res.status(409).json({
                success: false,
                message: "Mobile number is already registered"
            });
        }

        // Create driver document
        const driver = new DriverProfile({
            personalInfo: {
                name: data.name,
                email: data.email,
                dob: data.dob,
                gender: data.gender,
                mobile: data.mobile1,
                altMobile: data.mobile2,
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
                languages: data.languages,
                nightShift: data.nightShift
            }
        });

        await driver.save();
        res.status(201).json({ success: true, message: "Driver profile created successfully", driver });

    } catch (err) {
        console.error("Error in createProfile:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { createProfile };
