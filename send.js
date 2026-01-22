module.exports = async (req, res) => {
    const token = process.env.BOT_TOKEN;
    if (!token) return res.status(500).json({ error: "Thieu BOT_TOKEN" });

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type, media, text, chat_id } = req.body;

        // --- GỬI TIN NHẮN (TEXT) ---
        if (type === 'text') {
            const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id, text })
            });
            return res.status(200).json(await r.json());
        }

        // --- GỬI ALBUM ẢNH (GROUP MEDIA) ---
        if (type === 'media' && Array.isArray(media)) {
            const formData = new FormData();
            formData.append('chat_id', chat_id);

            const telegramMedia = media.map((item, index) => {
                const fieldName = `file${index}`;
                
                // 1. Chuyển Base64 thành File Blob
                const b64 = item.media.split(',')[1]; 
                const buf = Buffer.from(b64, 'base64');
                const blob = new Blob([buf], { type: 'image/jpeg' });
                
                // 2. Đính kèm vào FormData
                formData.append(fieldName, blob, `image${index}.jpg`);

                // 3. Tạo object khai báo cho Telegram
                return {
                    type: 'photo',
                    media: `attach://${fieldName}`,
                    caption: item.caption || ''
                };
            });

            formData.append('media', JSON.stringify(telegramMedia));

            // 4. Gửi một lần duy nhất (sendMediaGroup)
            const r = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
                method: 'POST',
                body: formData
            });
            
            return res.status(200).json(await r.json());
        }

        return res.status(400).json({ error: "Data loi" });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
