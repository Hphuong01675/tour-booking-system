import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../features/auth/authSlice";
import GuideHeader from "./GuideHeader";
import GuideFooter from "./GuideFooter";

const GuideLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/login", { replace: true });
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <GuideHeader currentUser={user} onLogoutClick={handleLogout} />
            <div className="flex-grow flex flex-col">
                <Outlet />
            </div>
            <GuideFooter />
        </div>
    );
};

export default GuideLayout;
