const fs = require("fs");
const {TimeSlotController} = require("./timeSlotController");
const {TimeslotDateData} = require("../availabilityDate-handler/timeslotDateData");
const {Publisher} = require ("../services/publisher");

class BookingController {
    constructor() {
        this.timeslotDateData = new TimeslotDateData();
        this.publisher = new Publisher();
    }
    processMessage(message) {
        const timeSlotController = new TimeSlotController();

        let availabilityResponse = timeSlotController.checkAvailability(message);
        if (availabilityResponse.available === true) {
            timeSlotController.takeTimeSlot(availabilityResponse);
            this.updateAvailabilityForDate(availabilityResponse);
        }
        this.publisher.publishBookingConfirmation(availabilityResponse);

    }

    updateAvailabilityForDate(booking) {
        const availabilityDir = './availability-data/';
        let clinicsNumber = fs.readdirSync(availabilityDir).length;
        let date = booking.time.split(' ')[0];
        let availability =  this.timeslotDateData.getAvailabilityForClinicForDate(booking.dentistid, date);

        // when the last timeslot of clinic for a date has been taken it should check the availability for the other clinics for that date ans republish the current availability status
        if (!availability) {
            let availabilityForDate = this.timeslotDateData.getAvailabilityForAllClinicsForDate(clinicsNumber, date);
            this.publisher.publishAvailabilityForDate(date, JSON.stringify(availabilityForDate));
        }
    }
}
module.exports.BookingController = BookingController