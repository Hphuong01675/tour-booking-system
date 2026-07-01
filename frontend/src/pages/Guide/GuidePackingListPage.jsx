import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuideHeader from '../../components/Guide/GuideHeader';
import GuideFooter from '../../components/Guide/GuideFooter';
import { useAppModal } from '../../components/Guide/AppModal';
import { getChecklistTemplates, getPackingItems, createPackingItem, updatePackingItem, deletePackingItem, getGuideProfile } from '../../api/guideApi';

const CATEGORY_MAP = {
  DOCUMENT: { name: 'Giấy tờ', icon: 'description' },
  FINANCE: { name: 'Tiền bạc', icon: 'payments' },
  CLOTHING: { name: 'Trang phục & Phụ kiện', icon: 'checkroom' },
  PERSONAL_CARE: { name: 'Vệ sinh cá nhân', icon: 'clean_hands' },
  ELECTRONICS: { name: 'Thiết bị điện tử', icon: 'devices' },
  HEALTH: { name: 'Y tế & Sức khỏe', icon: 'medical_services' },
  EQUIPMENT: { name: 'Trang bị chuyên dụng', icon: 'hiking' },
  FOOD_DRINK: { name: 'Đồ ăn & Thức uống', icon: 'restaurant' },
};

const GuidePackingListPage = () => {
  const navigate = useNavigate();
  const { showModal, AppModal } = useAppModal();

  // State
  const [currentUser, setCurrentUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [packingItems, setPackingItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    description: '',
    size: '',
    unit: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch profile
        try {
          const profile = await getGuideProfile();
          setCurrentUser(profile || null);
        } catch (err) {
          console.warn('Failed to fetch profile:', err);
        }

        // Fetch templates
        const templatesData = await getChecklistTemplates();
        setTemplates(templatesData || []);

        // Fetch packing items
        const itemsData = await getPackingItems();
        setPackingItems(itemsData || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Không thể tải dữ liệu. Vui lòng tải lại trang.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle add new item
  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      category: '',
      name: '',
      description: '',
      size: '',
      unit: '',
      notes: ''
    });
    setShowForm(true);
  };

  // Handle edit item
  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      category: item.category,
      name: item.name,
      description: item.description || '',
      size: item.size || '',
      unit: item.unit || '',
      notes: item.notes || ''
    });
    setShowForm(true);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!formData.category || !formData.name.trim()) {
      showModal('Vui lòng nhập nhóm và tên vật dụng.', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      if (editingId) {
        // Update
        const updated = await updatePackingItem(editingId, formData);
        setPackingItems(prev => prev.map(item => item.id === editingId ? updated : item));
        showModal('Cập nhật thành công!', 'success');
      } else {
        // Create
        const created = await createPackingItem(formData);
        setPackingItems(prev => [...prev, created]);
        showModal('Thêm vật dụng thành công!', 'success');
      }
      setShowForm(false);
      setFormData({
        category: '',
        name: '',
        description: '',
        size: '',
        unit: '',
        notes: ''
      });
    } catch (err) {
      console.error('Error saving item:', err);
      showModal('Không thể lưu. Vui lòng thử lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete item
  const handleDelete = async (itemId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa vật dụng này?')) return;

    try {
      await deletePackingItem(itemId);
      setPackingItems(prev => prev.filter(item => item.id !== itemId));
      showModal('Xóa thành công!', 'success');
    } catch (err) {
      console.error('Error deleting item:', err);
      showModal('Không thể xóa. Vui lòng thử lại.', 'error');
    }
  };

  // Group items by category
  const groupedItems = {};
  packingItems.forEach(item => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category].push(item);
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <GuideHeader currentUser={currentUser} />
        <main className="flex-grow flex items-center justify-center p-xl">
          <div className="text-center">
            <span className="material-symbols-outlined text-primary text-[48px] animate-spin">sync</span>
            <p className="font-body-md text-on-surface-variant mt-sm">Đang tải danh sách vật dụng...</p>
          </div>
        </main>
        <GuideFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppModal />
      <GuideHeader currentUser={currentUser} />

      <main className="flex-grow py-xl px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto w-full">
        {/* Header */}
        <div className="mb-xl">
          <div className="flex items-center justify-between gap-md mb-md">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Quản lý Danh sách Vật dụng</h2>
              <p className="font-body-md text-on-surface-variant">Quản lý vật dụng cá nhân cho các chuyến đi</p>
            </div>
            <button
              onClick={handleAdd}
              className="bg-primary text-on-primary px-lg py-md rounded-xl font-label-md flex items-center gap-sm hover:bg-primary-container transition-all shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined">add</span>
              Thêm vật dụng
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-lg p-md rounded-lg bg-error-container/20 border border-error/30 flex items-start gap-md">
            <span className="material-symbols-outlined text-error flex-shrink-0 mt-0.5">error</span>
            <div className="flex-grow">
              <p className="font-label-md text-error font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-lg">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="bg-surface-container-lowest p-xl rounded-xl shadow-sm border border-outline-variant/30 text-center">
              <span className="material-symbols-outlined text-outline text-[48px] block mb-md">inventory_2</span>
              <h3 className="font-headline-sm text-on-surface mb-sm">Chưa có vật dụng nào</h3>
              <p className="font-body-md text-on-surface-variant mb-lg">Bắt đầu bằng cách thêm vật dụng đầu tiên</p>
              <button
                onClick={handleAdd}
                className="bg-primary text-on-primary px-lg py-md rounded-xl font-label-md hover:bg-primary-container transition-all"
              >
                <span className="material-symbols-outlined mr-xs">add</span>
                Thêm vật dụng
              </button>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
                <div className="flex items-center gap-md mb-lg border-b border-outline-variant/20 pb-md">
                  <span className="material-symbols-outlined text-primary text-[28px]">
                    {CATEGORY_MAP[category]?.icon || 'category'}
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-on-surface">{CATEGORY_MAP[category]?.name || category}</h3>
                    <p className="font-body-sm text-on-surface-variant">{items.length} vật dụng</p>
                  </div>
                </div>

                <div className="space-y-sm">
                  {items.map(item => (
                    <div key={item.id} className="bg-surface-container p-md rounded-lg border border-outline-variant/20 flex items-start justify-between gap-md">
                      <div className="flex-grow">
                        <h4 className="font-label-md text-on-surface font-semibold">{item.name}</h4>
                        {item.description && (
                          <p className="font-body-sm text-on-surface-variant mt-1">{item.description}</p>
                        )}
                        <div className="flex gap-md mt-sm text-label-sm text-on-surface-variant">
                          {item.size && <span>📏 Kích cỡ: {item.size}</span>}
                          {item.unit && <span>📦 Đơn vị: {item.unit}</span>}
                        </div>
                        {item.notes && (
                          <div className="mt-sm p-sm bg-surface-container-low rounded border-l-2 border-primary text-label-sm">
                            💡 {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-sm">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-sm text-primary hover:bg-primary-fixed rounded-lg transition-all"
                          title="Sửa"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-sm text-error hover:bg-error-container/30 rounded-lg transition-all"
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 backdrop-blur-sm p-md">
          <div className="bg-surface-container-lowest rounded-2xl p-xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-lg border-b border-outline-variant/30 pb-md">
              <h3 className="font-headline-sm text-on-surface">
                {editingId ? 'Sửa vật dụng' : 'Thêm vật dụng mới'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-md">
              {/* Category Select */}
              <div>
                <label htmlFor="category" className="block font-label-md text-label-md text-on-surface mb-xs">
                  Nhóm vật dụng <span className="text-error">*</span>
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg font-body-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">-- Chọn nhóm --</option>
                  {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                    <option key={key} value={key}>{val.name}</option>
                  ))}
                </select>
              </div>

              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block font-label-md text-label-md text-on-surface mb-xs">
                  Tên vật dụng <span className="text-error">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="VD: Giày thể thao"
                  className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg font-body-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block font-label-md text-label-md text-on-surface mb-xs">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả chi tiết vật dụng..."
                  rows="3"
                  className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg font-body-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Size & Unit */}
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label htmlFor="size" className="block font-label-md text-label-md text-on-surface mb-xs">
                    Kích cỡ (Tùy chọn)
                  </label>
                  <input
                    id="size"
                    type="text"
                    value={formData.size}
                    onChange={handleInputChange}
                    placeholder="VD: M, 42"
                    className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg font-body-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="unit" className="block font-label-md text-label-md text-on-surface mb-xs">
                    Đơn vị (Tùy chọn)
                  </label>
                  <input
                    id="unit"
                    type="text"
                    value={formData.unit}
                    onChange={handleInputChange}
                    placeholder="VD: chiếc, bộ"
                    className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg font-body-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block font-label-md text-label-md text-on-surface mb-xs">
                  Ghi chú (Tùy chọn)
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Ghi chú quan trọng cho vật dụng này..."
                  rows="2"
                  className="w-full px-md py-sm bg-surface border border-outline-variant rounded-lg font-body-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-md mt-xl border-t border-outline-variant/20 pt-lg">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-surface-container text-on-surface px-lg py-md rounded-xl font-label-md hover:bg-surface-container-high transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-primary text-on-primary px-lg py-md rounded-xl font-label-md hover:bg-primary-container transition-all disabled:opacity-50 flex items-center justify-center gap-sm"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    {editingId ? 'Cập nhật' : 'Thêm mới'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <GuideFooter />
    </div>
  );
};

export default GuidePackingListPage;

