# 🚀 AludaAI Server - Data Persistence Guide

## **📁 Server Scripts**

### **Windows Users:**
```bash
# Double-click on server.bat or run in Command Prompt:
server.bat
```

### **macOS/Linux Users:**
```bash
# Make executable and run:
chmod +x server.sh
./server.sh

# Or run directly:
bash server.sh
```

## **💾 Data Persistence**

### **How It Works:**
1. **localStorage Storage** - ყველა ჩათი და შეტყობინება ინახება ბრაუზერში
2. **Automatic Saving** - ავტომატურად ინახება ყოველ ცვლილებაზე
3. **Cross-Session** - მონაცემები ინახება session-ებს შორის
4. **Browser Storage** - მონაცემები ინახება ბრაუზერის localStorage-ში

### **What Gets Saved:**
- ✅ **Chats Array** - ყველა ჩათი
- ✅ **Current Chat ID** - მიმდინარე ჩათის ID
- ✅ **Messages** - ყველა შეტყობინება
- ✅ **Chat Titles** - ჩათების სათაურები
- ✅ **Timestamps** - შექმნის დრო

## **🔧 Server Features**

### **Automatic Checks:**
- ✅ **Node.js Installation** - ამოწმებს Node.js-ის არსებობას
- ✅ **npm Installation** - ამოწმებს npm-ის არსებობას
- ✅ **Dependencies** - ავტომატურად ინსტალირებს dependencies
- ✅ **Server Start** - გაუშვებს Next.js სერვერს

### **Error Handling:**
- ✅ **Installation Errors** - აჩვენებს შეცდომებს
- ✅ **Dependency Issues** - ამოწმებს dependencies
- ✅ **User Feedback** - მომხმარებელს აძლევს უკუკავშირს

## **📱 Usage Instructions**

### **1. Start Server:**
```bash
# Windows:
server.bat

# macOS/Linux:
./server.sh
```

### **2. Open Browser:**
```
http://localhost:3000/chat
```

### **3. Create Chats:**
- დააჭირეთ "ახალი საუბარი"
- დაწერეთ შეტყობინება
- ნახეთ როგორ ინახება

### **4. Data Persistence:**
- გახსენით რამდენიმე ჩათი
- დააჭირეთ refresh
- ნახეთ როგორ რჩება ყველაფერი

## **🗂️ Data Storage Location**

### **Browser localStorage:**
```javascript
// Keys used:
'aluda_chats'           // Array of all chats
'aluda_current_chat_id' // Current selected chat ID
```

### **Data Structure:**
```json
{
  "id": "chat_1234567890",
  "title": "JavaScript პროგრამირება",
  "timestamp": "2025-08-15T18:00:00.000Z",
  "messages": [
    {
      "id": "msg_123",
      "role": "user",
      "content": "გამარჯობა!",
      "timestamp": "2025-08-15T18:00:00.000Z"
    },
    {
      "id": "msg_124",
      "role": "assistant",
      "content": "გამარჯობა! როგორ შემიძლია დაგეხმაროთ?",
      "timestamp": "2025-08-15T18:00:01.000Z"
    }
  ]
}
```

## **⚠️ Important Notes**

### **Data Persistence:**
- ✅ **Browser Storage** - მონაცემები ინახება ბრაუზერში
- ✅ **No Server Storage** - სერვერზე არ ინახება
- ✅ **Local Only** - მხოლოდ ლოკალურად
- ✅ **Cross-Tab** - მუშაობს ყველა tab-ში

### **Limitations:**
- ❌ **Browser Dependent** - მხოლოდ იმავე ბრაუზერში
- ❌ **No Cloud Sync** - cloud-ზე არ ინახება
- ❌ **Device Specific** - მხოლოდ იმავე მოწყობილობაზე

## **🚀 Quick Start**

1. **Download/Clone** AludaAI project
2. **Run Server Script:**
   ```bash
   # Windows:
   server.bat
   
   # macOS/Linux:
   ./server.sh
   ```
3. **Open Browser:** http://localhost:3000/chat
4. **Start Chatting:** ჩათები ავტომატურად ინახება!

## **🔍 Troubleshooting**

### **Common Issues:**
- **Node.js not found:** Install Node.js from https://nodejs.org/
- **npm not found:** Install npm with Node.js
- **Port 3000 busy:** Stop other servers or change port
- **Dependencies failed:** Delete node_modules and run npm install

### **Data Issues:**
- **Chats not saving:** Check browser console for errors
- **localStorage full:** Clear browser data or use incognito mode
- **Data corrupted:** Clear localStorage and start fresh

---

**🎉 Enjoy your persistent AludaAI experience!**
