import axios from "axios";

export const imageUpload = async (data) => {
    let fileData = new FormData()
    fileData.append("file", data);
    fileData.append("cloud_name", 'dg9uxwjhr')
    fileData.append('upload_preset', 'Chat_Application')

    let res = await axios.post(`https://api.cloudinary.com/v1_1/dg9uxwjhr/image/upload`, fileData)
    return res.data.secure_url;
}
