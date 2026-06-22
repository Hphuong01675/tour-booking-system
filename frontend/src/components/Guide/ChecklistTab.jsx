import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getPackingItems, createPackingItem, getChecklistTemplates, saveChecklistTemplate, sendGroupNotification } from '../../api/guideApi';

const CATEGORY_MAP = {
  DOCUMENT: { title: 'Giấy tờ', icon: 'description', colorClass: 'bg-primary-fixed text-primary' },
  FINANCE: { title: 'Tiền bạc', icon: 'payments', colorClass: 'bg-green-100 text-green-700' },
  CLOTHING: { title: 'Trang phục', icon: 'checkroom', colorClass: 'bg-orange-100 text-orange-700' },
  PERSONAL_CARE: { title: 'Vật dụng cá nhân', icon: 'luggage', colorClass: 'bg-secondary-fixed text-secondary' },
  ELECTRONICS: { title: 'Thiết bị điện tử', icon: 'devices', colorClass: 'bg-blue-100 text-blue-700' },
  HEALTH: { title: 'Thuốc & Sức khỏe', icon: 'medical_services', colorClass: 'bg-tertiary-fixed text-tertiary' },
  EQUIPMENT: { title: 'Trang bị chuyên dụng', icon: 'construction', colorClass: 'bg-gray-200 text-gray-700' },
  FOOD_DRINK: { title: 'Đồ ăn & Thức uống', icon: 'fastfood', colorClass: 'bg-yellow-100 text-yellow-700' },
};

const ChecklistTab = ({ assignmentId, onSendUpdate }) => {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [requiredIds, setRequiredIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // Modals
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  
  // Data for modals
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Data for Add Item modal
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Data for Send Reminder modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [mandatoryNote, setMandatoryNote] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await getPackingItems();

      setItems(data);
      const defaults = new Set(data.filter(i => i.isSystem).map(i => i.id));
      setSelectedIds(defaults);
    } catch (error) {
      console.error('Failed to load items', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItem = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleRequired = (id, e) => {
    e.preventDefault();
    setRequiredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openSendModal = () => {
    if (selectedIds.size === 0) {
      alert('Vui lòng chọn ít nhất 1 vật dụng để gửi nhắc nhở!');
      return;
    }
    setMandatoryNote('');
    setShowSendModal(true);
  };

  const confirmSendReminder = async () => {
    try {
      setIsSendingReminder(true);
      
      const checklist = Object.entries(CATEGORY_MAP).map(([catKey, categoryInfo]) => {
        const catItems = items.filter(i => i.category === catKey && selectedIds.has(i.id));
        if (catItems.length === 0) return null;
        return {
          name: categoryInfo.title,
          items: catItems.map(i => ({
            name: i.title,
            checked: true,
            isRequired: requiredIds.has(i.id)
          }))
        };
      }).filter(Boolean);

      await sendGroupNotification(assignmentId, {
        type: 'reminder',
        checklist,
        mandatoryNote: mandatoryNote.trim()
      });

      setShowSendModal(false);
      alert('Đã gửi email nhắc nhở chuẩn bị hành trang thành công!');
    } catch (error) {
      alert('Không thể gửi nhắc nhở. Vui lòng thử lại.');
      console.error(error);
    } finally {
      setIsSendingReminder(false);
    }
  };

  const openAddItemModal = (category) => {
    setNewItemCategory(category);
    setNewItemTitle('');
    setNewItemContent('');
    setShowAddItemModal(true);
  };

  const confirmAddItem = async () => {
    if (!newItemTitle || !newItemTitle.trim()) {
      alert('Vui lòng nhập tên vật dụng!');
      return;
    }

    try {
      setIsAddingItem(true);
      const newItem = await createPackingItem({
        category: newItemCategory,
        title: newItemTitle.trim(),
        content: newItemContent.trim()
      });
      setItems(prev => [...prev, newItem]);
      setSelectedIds(prev => new Set(prev).add(newItem.id));
      setShowAddItemModal(false);
    } catch (error) {
      alert('Không thể tạo vật dụng mới. Vui lòng thử lại.');
      console.error(error);
    } finally {
      setIsAddingItem(false);
    }
  };

  const normalizeTemplate = (template) => ({
    ...template,
    items: (template.items || [])
      .map((templateItem) => ({
        ...templateItem,
        itemId: templateItem.itemId || templateItem.item?.id,
      }))
      .filter((templateItem) => templateItem.itemId),
  });

  const openTemplatesModal = async () => {
    setShowTemplatesModal(true);
    setIsLoadingTemplates(true);
    setTemplateLoadError('');
    try {
      const data = await getChecklistTemplates();
      const templateList = Array.isArray(data) ? data : data?.templates || [];
      setTemplates(templateList.map(normalizeTemplate));
    } catch (error) {
      setTemplates([]);
      setTemplateLoadError('Khong the tai danh sach mau. Vui long thu lai.');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleApplyTemplate = (template) => {
    const itemIds = template.items?.map(i => i.itemId) || [];
    const requiredItemIds = template.items?.filter(i => i.isRequired).map(i => i.itemId) || [];
    setSelectedIds(new Set(itemIds));
    setRequiredIds(new Set(requiredItemIds));
    setShowTemplatesModal(false);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) return;
    if (selectedIds.size === 0) {
      alert('Vui long chon it nhat 1 vat dung.');
      return;
    }

    try {
      setIsSavingTemplate(true);
      const payload = {
        name: newTemplateName.trim(),
        items: Array.from(selectedIds).map(itemId => ({
          itemId,
          isRequired: requiredIds.has(itemId)
        }))
      };
      const savedTemplate = await saveChecklistTemplate(payload);
      setShowSaveModal(false);
      setNewTemplateName('');
      setTemplates(prev => [normalizeTemplate(savedTemplate || payload), ...prev]);
      alert('Da luu mau thanh cong!');
    } catch (error) {
      alert('Khong the luu mau. Vui long thu lai.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Group items
  const groupedItems = Object.keys(CATEGORY_MAP).reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="text-center py-xl">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-lg">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-xl gap-lg mt-md">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-base">Quản lý Vật dụng Cần mang</h2>
          <p className="text-on-surface-variant font-body-md">Thiết lập danh sách kiểm tra vật dụng cần thiết cho các chuyến đi.</p>
        </div>
        <div className="flex items-center gap-md">
          <button 
            onClick={openTemplatesModal}
            className="flex items-center gap-xs px-md py-sm bg-surface-container-highest border border-outline-variant rounded-lg text-on-surface font-label-md hover:bg-surface-variant transition-all"
          >
            <span className="material-symbols-outlined">auto_awesome_motion</span>
            Chọn từ mẫu
          </button>
          <button 
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-xs px-md py-sm border border-primary text-primary font-label-md rounded-lg hover:bg-primary-fixed transition-all"
          >
            <span className="material-symbols-outlined">save</span>
            Lưu thành mẫu
          </button>
          <button 
            onClick={openSendModal}
            disabled={isSendingReminder || selectedIds.size === 0}
            className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined">send</span>
            {isSendingReminder ? 'Đang chuẩn bị...' : 'Gửi nhắc nhở'}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="gap-lg flex flex-col">
        {Object.entries(CATEGORY_MAP).map(([catKey, catMeta]) => {
          const categoryItems = groupedItems[catKey] || [];
          
          return (
            <section key={catKey} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm transition-all card-hover">
              <div className="flex justify-between items-start mb-md">
                <div className="flex items-center gap-sm">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${catMeta.colorClass}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {catMeta.icon}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{catMeta.title}</h3>
                </div>
              </div>
              <div className="space-y-sm mb-lg">
                {categoryItems.length > 0 ? (
                  categoryItems.map(item => (
                    <label key={item.id} className="flex items-center gap-md p-sm rounded-lg hover:bg-surface-container transition-colors cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => handleToggleItem(item.id)}
                        className="w-5 h-5 rounded border-outline text-primary focus:ring-primary"
                      />
                      <div className="flex flex-col flex-grow">
                        <span className="font-body-md text-on-surface">{item.title}</span>
                        {item.content && (
                          <span className="font-label-sm text-on-surface-variant mt-xs line-clamp-2">{item.content}</span>
                        )}
                      </div>
                      
                      {selectedIds.has(item.id) && (
                        <button
                          onClick={(e) => handleToggleRequired(item.id, e)}
                          className={`mr-sm px-2 py-1 rounded-md text-[11px] font-bold border transition-colors ${requiredIds.has(item.id) ? 'bg-error-container text-error border-error-container' : 'bg-surface border-outline-variant text-outline hover:bg-surface-variant'}`}
                        >
                          {requiredIds.has(item.id) ? 'BẮT BUỘC' : 'TÙY CHỌN'}
                        </button>
                      )}
                      
                      <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 text-outline text-sm">drag_indicator</span>
                    </label>
                  ))
                ) : (
                  <p className="font-body-sm text-outline italic text-center py-sm border border-dashed border-outline-variant/50 rounded-lg">
                    Chưa có vật dụng nào trong chủ đề này
                  </p>
                )}
              </div>
              <button 
                onClick={() => openAddItemModal(catKey)}
                className="w-full py-sm border-2 border-dashed border-outline-variant rounded-lg text-outline font-label-md hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-xs"
              >
                <span className="material-symbols-outlined">add</span>
                Thêm vật dụng
              </button>
            </section>
          );
        })}
      </div>

      {/* MODAL: Lưu thành mẫu */}
      {showSaveModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4">
          <div className="guide-modal-panel bg-surface-container-lowest rounded-xl p-lg shadow-xl">
            <h4 className="font-headline-sm text-on-surface mb-md">Lưu danh sách hiện tại thành mẫu</h4>
            <div className="space-y-md">
              <div>
                <label className="block font-label-md text-on-surface-variant mb-xs">Tên mẫu</label>
                <input 
                  type="text" 
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="VD: Tour Trekking, Tour Biển mùa hè..." 
                  className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-sm pt-md">
                <button 
                  onClick={() => setShowSaveModal(false)}
                  className="px-md py-sm rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate || !newTemplateName.trim()}
                  className="px-md py-sm rounded-lg font-label-md bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSavingTemplate ? 'Đang lưu...' : 'Lưu mẫu'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: Chọn từ mẫu */}
      {showTemplatesModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4">
          <div className="guide-modal-panel bg-surface-container-lowest rounded-xl p-lg shadow-xl">
            <h4 className="font-headline-sm text-on-surface mb-md">Chọn từ mẫu có sẵn</h4>
            <div className="space-y-sm max-h-[300px] overflow-y-auto pr-sm">
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center gap-sm p-lg text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span className="font-body-md">Dang tai danh sach mau...</span>
                </div>
              ) : templateLoadError ? (
                <div className="text-center p-lg border border-dashed border-error/40 rounded-lg bg-error-container/30">
                  <span className="material-symbols-outlined text-[40px] text-error mb-sm">error</span>
                  <p className="font-body-md text-error">{templateLoadError}</p>
                  <button
                    onClick={openTemplatesModal}
                    className="mt-md px-md py-sm rounded-lg font-label-md bg-primary text-on-primary hover:opacity-90 transition-all"
                  >
                    Tai lai
                  </button>
                </div>
              ) : templates.length > 0 ? (
                templates.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => handleApplyTemplate(t)}
                    className="w-full text-left p-sm border border-outline-variant rounded-lg hover:border-primary hover:bg-primary-fixed/50 transition-all"
                  >
                    <p className="font-headline-sm text-primary">{t.name}</p>
                    <p className="text-label-sm text-on-surface-variant mt-xs">Gồm {t.items?.length || 0} vật dụng</p>
                  </button>
                ))
              ) : (
                <div className="text-center p-lg border border-dashed border-outline-variant rounded-lg bg-surface-container-low">
                  <span className="material-symbols-outlined text-[48px] text-outline mb-sm">inventory_2</span>
                  <p className="font-body-md text-on-surface-variant">Bạn chưa có mẫu nhắc nhở nào.</p>
                  <p className="text-label-sm text-outline mt-xs">Hãy check chọn các vật dụng ở ngoài và bấm "Lưu thành mẫu".</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/30 mt-md">
              <button 
                onClick={() => setShowTemplatesModal(false)}
                className="px-md py-sm rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: Thêm vật dụng mới */}
      {showAddItemModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4">
          <div className="guide-modal-panel bg-surface-container-lowest rounded-xl p-lg shadow-xl">
            <h4 className="font-headline-sm text-on-surface mb-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              Thêm vật dụng mới
            </h4>
            <div className="mb-md p-sm bg-primary-fixed/30 rounded-lg">
              <p className="font-label-md text-primary">Chủ đề: {CATEGORY_MAP[newItemCategory]?.title}</p>
            </div>
            <div className="space-y-md">
              <div>
                <label className="block font-label-md text-on-surface-variant mb-xs">
                  Tên vật dụng hiển thị <span className="text-error">*</span>
                </label>
                <input 
                  type="text" 
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="VD: CCCD / CMND, Sạc dự phòng..." 
                  className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary font-body-md"
                />
              </div>
              <div>
                <label className="block font-label-md text-on-surface-variant mb-xs">
                  Mô tả chi tiết / Yêu cầu thêm (Tuỳ chọn)
                </label>
                <textarea 
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  placeholder="VD: Yêu cầu bản gốc, sạc đầy pin trước khi mang đi..." 
                  rows="3"
                  className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary font-body-sm text-on-surface"
                />
              </div>
              <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/30">
                <button 
                  onClick={() => setShowAddItemModal(false)}
                  className="px-md py-sm rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmAddItem}
                  disabled={isAddingItem || !newItemTitle.trim()}
                  className="px-md py-sm rounded-lg font-label-md bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isAddingItem ? 'Đang thêm...' : 'Lưu vật dụng'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: Nhập lời nhắn bắt buộc & Gửi email */}
      {showSendModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4">
          <div className="guide-modal-panel bg-surface-container-lowest rounded-xl p-lg shadow-xl">
            <h4 className="font-headline-sm text-on-surface mb-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary">send</span>
              Gửi lời nhắc hành trang
            </h4>
            <div className="space-y-md">
              <p className="font-body-sm text-on-surface-variant">
                Bạn đang chuẩn bị gửi thông báo nhắc nhở chuẩn bị hành trang gồm <strong>{selectedIds.size} vật dụng</strong> tới toàn bộ hành khách của chuyến đi.
              </p>
              <div>
                <label className="block font-label-md text-on-surface-variant mb-xs">
                  Lời nhắn chung bổ sung (nếu có):
                </label>
                <textarea 
                  value={mandatoryNote}
                  onChange={(e) => setMandatoryNote(e.target.value)}
                  placeholder="VD: Nhớ mang CCCD bản gốc để lên máy bay..." 
                  rows="3"
                  className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary font-body-sm text-on-surface"
                />
              </div>
              <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/30">
                <button 
                  onClick={() => setShowSendModal(false)}
                  className="px-md py-sm rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmSendReminder}
                  disabled={isSendingReminder}
                  className="flex items-center gap-xs px-md py-sm rounded-lg font-label-md bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  {isSendingReminder ? 'Đang gửi...' : 'Gửi Email Khách'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ChecklistTab;
