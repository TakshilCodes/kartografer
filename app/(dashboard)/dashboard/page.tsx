import LogoutButton from "@/components/shared/LogoutButton";

export default function Dashboard(){
    return (
        <div>
            Dashboard
            <LogoutButton redirectTo="/signin" />
        </div>
    )
}