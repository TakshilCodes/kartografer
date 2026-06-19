import TripCard, { type MyTripCardData } from "./TripCard";

type MyTripsGridProps = {
  trips: MyTripCardData[];
};

export default function MyTripsGrid({ trips }: MyTripsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
