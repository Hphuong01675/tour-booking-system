import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import OperatorHeader from "../../components/operator/OperatorHeader";
import OperatorFooter from "../../components/operator/OperatorFooter";
import { getOperatorProfile, getTourParticipants, getOperatorTourDetail } from "../../api/operatorApi";

const OperatorParticipantsPage = () => {
    const { id } = useParams(); // tourId
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [tour, setTour] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileData = await getOperatorProfile();
                setUser(profileData);
            } catch (err) {
                console.error("Failed to load profile", err);
            }
        };
        fetchProfile();
    }, []);

    const fetchTourDetailsAndParticipants = async () => {
        setLoading(true);
        try {
            const tourData = await getOperatorTourDetail(id);
            setTour(tourData);

            const partsData = await getTourParticipants(id, {
                search: searchQuery,
                type: typeFilter
            });
            setParticipants(partsData);
        } catch (err) {
            console.error("Failed to load participants", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTourDetailsAndParticipants();
    }, [id, typeFilter]); // Refetch on filter change or id change

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchTourDetailsAndParticipants();
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "paid":
                return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Đã phê duyệt</span>;
            case "pending_approval":
                return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Chờ xác thực</span>;
            case "cancelled":
                return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Đã từ chối</span>;
            default:
                return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">{status}</span>;
        }
    };

    return (
        <div className="bg-background text-on-background min-h-screen flex flex-col">
            <OperatorHeader currentUser={user} />

            <main className="flex-grow pt-24 pb-s-xl px-s-margin-mobile md:px-s-margin-desktop max-w-[1440px] mx-auto w-full">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
                    <span className="cursor-pointer hover:text-primary transition" onClick={() => navigate("/operator/approvals/hard")}>
                        Duyệt Tour Hard
                    </span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-primary font-semibold">Danh sách Hành khách</span>
                </nav>

                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-s-xl gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Danh sách Hành khách tham gia Tour</h1>
                        {tour && (
                            <p className="text-sm text-on-surface-variant mt-1">
                                Tour: <span className="font-bold text-on-surface">{tour.title}</span> | Mã tour: <span className="font-semibold">{tour.tourCode}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Filters Row */}
                <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-5 mb-s-lg">
                    <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-end gap-4">
                        {/* Search Input */}
                        <div className="flex flex-col flex-1 min-w-[250px]">
                            <label className="text-xs text-on-surface-variant mb-1 font-medium">Tên hành khách</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm tên hành khách..."
                                    className="pl-10 pr-4 py-2 w-full rounded-lg border border-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>

                        {/* Passenger Type Dropdown */}
                        <div className="flex flex-col">
                            <label className="text-xs text-on-surface-variant mb-1 font-medium">Loại hành khách</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-outline-variant text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-[160px] h-[38px]"
                            >
                                <option value="all">Tất cả loại</option>
                                <option value="adult">Người lớn</option>
                                <option value="child">Trẻ em</option>
                            </select>
                        </div>

                        {/* Search Button */}
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition h-[38px]"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </div>

                {/* Participants Table */}
                <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_2fr_1.2fr_1.2fr] gap-4 px-6 py-3 bg-surface-container-low text-xs font-semibold uppercase text-on-surface-variant tracking-wide border-b border-outline-variant/20">
                        <span>Hành khách</span>
                        <span>Ngày sinh</span>
                        <span>Loại</span>
                        <span>Mã đặt chỗ</span>
                        <span>Trưởng đoàn (SĐT)</span>
                        <span className="text-center">Trạng thái</span>
                        <span className="text-right">Thao tác</span>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-outline-variant/20">
                        {loading ? (
                            <div className="text-center py-12 text-sm text-on-surface-variant">
                                Đang tải danh sách hành khách...
                            </div>
                        ) : participants.length === 0 ? (
                            <div className="text-center py-12 text-sm text-on-surface-variant">
                                Không tìm thấy hành khách nào tham gia.
                            </div>
                        ) : (
                            participants.map((p) => (
                                <div
                                    key={p.id}
                                    className="grid grid-cols-[2fr_1.2fr_1fr_1fr_2fr_1.2fr_1.2fr] gap-4 px-6 py-4 items-center hover:bg-surface-container-low/50 transition-colors"
                                >
                                    {/* Name */}
                                    <div className="font-semibold text-sm text-on-surface truncate">
                                        {p.fullName}
                                    </div>

                                    {/* DOB */}
                                    <div className="text-sm text-on-surface-variant">
                                        {p.dateOfBirth}
                                    </div>

                                    {/* Type */}
                                    <div className="text-sm text-on-surface">
                                        {p.participantType}
                                    </div>

                                    {/* Booking Code */}
                                    <div className="text-sm font-medium text-primary">
                                        {p.bookingCode}
                                    </div>

                                    {/* Lead customer */}
                                    <div className="text-sm text-on-surface truncate">
                                        <p>{p.leadCustomer}</p>
                                        <p className="text-xs text-on-surface-variant">{p.leadPhone}</p>
                                    </div>

                                    {/* Status */}
                                    <div className="text-center">
                                        {getStatusBadge(p.status)}
                                    </div>

                                    {/* Action */}
                                    <div className="text-right">
                                        {p.status === "pending_approval" ? (
                                            <button
                                                onClick={() => navigate(`/operator/customers/verify/${p.bookingId}`)}
                                                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition"
                                            >
                                                Xác thực hồ sơ
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/operator/customers/verify/${p.bookingId}`)}
                                                className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-container-low transition"
                                            >
                                                Xem hồ sơ
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <OperatorFooter />
        </div>
    );
};

export default OperatorParticipantsPage;
