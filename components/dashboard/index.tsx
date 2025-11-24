import AvailabilityGrid from "./availability-grid";
import FixedAppointments from "./appointments/fixed";
import AppointmentsForm from "./appointments/form";
import AppointmentsList from "./appointments/list";

export default function Dashboard() {
    return (
        <main className="max-w-3xl mx-auto p-4 md:px-0 flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Ciao, utente 👋</h1>
                <p className="text-gray-600 text-sm">Compila gli impegni per verificare le disponibilità</p>
            </div>

            <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 md:col-span-5">
                    <AppointmentsForm />
                </div>

                <div className="col-span-12 md:col-span-7">
                    <AvailabilityGrid />
                    <AppointmentsList />
                </div>
            </div>
        </main>
    );
}