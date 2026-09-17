# 🌐 Backend i18n Quick Start

## ✅ Setup hoàn tất

```
Backend/locales/
├── i18n.js    # Core functions
├── vi.js      # Tiếng Việt
└── en.js      # English
```

## 🚀 Sử dụng ngay

### 1. Trong Controller
```javascript
// Thay vì:
res.json({ message: "Login successful" });

// Sử dụng:
res.json({ message: req.t('auth.loginSuccessful') });
```

### 2. Với validation
```javascript
if (!username) {
  return res.status(400).json({
    message: req.t('validation.required', { field: 'Username' })
  });
}
```

### 3. Frontend gửi ngôn ngữ

**Cách 1: Header (Recommended)**
```javascript
headers: {
  'Accept-Language': 'vi'  // hoặc 'en'
}
```

**Cách 2: Query**
```
/api/users/login?lang=vi
```

**Cách 3: Body**
```javascript
body: {
  username: 'user',
  password: 'pass',
  lang: 'vi'
}
```

## 📚 Keys có sẵn

### Common
```javascript
req.t('common.success')      // Thành công / Success
req.t('common.serverError')  // Lỗi máy chủ / Server error
req.t('common.notFound')     // Không tìm thấy / Not found
req.t('common.created')      // Đã tạo thành công / Created
```

### Auth
```javascript
req.t('auth.loginSuccessful')     // Đăng nhập thành công
req.t('auth.checkCredentials')    // Kiểm tra tên đăng nhập
req.t('auth.invalidToken')        // Token không hợp lệ
```

### Validation
```javascript
req.t('validation.required', { field: 'Name' })
// VI: "Name là bắt buộc"
// EN: "Name is required"

req.t('validation.invalid', { field: 'Email' })
// VI: "Email không hợp lệ"
// EN: "Email is invalid"
```

### Consumable
```javascript
req.t('consumable.created')       // Đã tạo consumable
req.t('consumable.notFound')      // Không tìm thấy
req.t('consumableSpec.nvlRequired') // NVL là bắt buộc
```

## 🔧 Template Controller

```javascript
export async function create(req, res) {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        message: req.t('validation.required', { field: 'Name' })
      });
    }
    
    const result = await Model.create(name);
    
    res.status(201).json({
      message: req.t('consumable.created'),
      data: result
    });
  } catch (err) {
    res.status(500).json({
      message: req.t('common.serverError')
    });
  }
}
```

## ➕ Thêm translations mới

**vi.js:**
```javascript
myModule: {
  created: "Đã tạo",
  error: "Lỗi",
}
```

**en.js:**
```javascript
myModule: {
  created: "Created",
  error: "Error",
}
```

**Sử dụng:**
```javascript
req.t('myModule.created')
```

## ✨ Đã áp dụng

- ✅ app.js - i18n middleware
- ✅ authController.js - Login/Register

## 📋 Cần áp dụng

- [ ] consumableController.js
- [ ] consumableSpecController.js
- [ ] machineInfoController.js
- [ ] modelInfoController.js
- [ ] productInfoController.js
- [ ] userController.js
- [ ] Các controllers khác...

---

**🎯 Rule: Replace ALL hardcoded messages với `req.t('key')`**
