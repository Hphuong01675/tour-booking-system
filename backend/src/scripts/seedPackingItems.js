const { PackingItem } = require('../models');

const seedPackingItems = async () => {
  try {
    const count = await PackingItem.count();
    
    if (count === 0) {
      console.log('Database is empty for PackingItems. Seeding default items...');
      
      const defaultItems = [
        { category: 'DOCUMENT', title: 'CCCD / CMND', content: 'Bản gốc, còn hạn sử dụng', isSystem: true },
        { category: 'DOCUMENT', title: 'Bằng lái xe', content: 'Cần thiết nếu có tự lái xe', isSystem: true },
        { category: 'DOCUMENT', title: 'Passport / Visa', content: 'Bắt buộc đối với các tour quốc tế', isSystem: true },
        { category: 'FINANCE', title: 'Tiền mặt lẻ', content: 'Dùng để chi tiêu dọc đường', isSystem: true },
        { category: 'FINANCE', title: 'Thẻ tín dụng / ATM', content: '', isSystem: true },
        { category: 'CLOTHING', title: 'Áo khoác mỏng', content: 'Giữ ấm khi đi xe hoặc ban đêm', isSystem: true },
        { category: 'CLOTHING', title: 'Giày thể thao / Giày bệt', content: 'Dễ di chuyển', isSystem: true },
        { category: 'PERSONAL_CARE', title: 'Kem chống nắng', content: 'Bảo vệ da', isSystem: true },
        { category: 'PERSONAL_CARE', title: 'Bàn chải & Kem đánh răng', content: 'Nên mang theo đồ cá nhân', isSystem: true },
        { category: 'ELECTRONICS', title: 'Sạc dự phòng', content: 'Đảm bảo điện thoại luôn có pin', isSystem: true },
        { category: 'ELECTRONICS', title: 'Cáp sạc / Củ sạc', content: '', isSystem: true },
        { category: 'HEALTH', title: 'Thuốc chống say tàu xe', content: 'Uống trước 30 phút khởi hành', isSystem: true },
        { category: 'HEALTH', title: 'Thuốc tiêu hóa / Đau bụng', content: 'Phòng hờ thay đổi thời tiết, thức ăn', isSystem: true },
        { category: 'HEALTH', title: 'Băng cá nhân / Urgo', content: '', isSystem: true },
        { category: 'EQUIPMENT', title: 'Ô / Dù / Áo mưa mỏng', content: 'Phòng ngừa thời tiết xấu', isSystem: true }
      ];

      for (const item of defaultItems) {
        await PackingItem.create(item);
      }
      
      console.log('Successfully seeded default Packing Items!');
    } else {
      console.log(`Database already has ${count} PackingItems. Skipping seeder.`);
    }
  } catch (error) {
    console.error('Error seeding PackingItems:', error);
  }
};

// If run directly via node
if (require.main === module) {
  seedPackingItems().then(() => process.exit(0));
}

module.exports = seedPackingItems;
