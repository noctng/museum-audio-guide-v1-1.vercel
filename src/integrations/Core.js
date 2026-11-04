// Đây là một hàm giả lập.
// Nó mô phỏng việc tải lên và trả về một URL giả sau 1.5 giây.
export const UploadFile = async ({ file }) => {
  console.log('Uploading file:', file.name);
  return new Promise(resolve => {
    setTimeout(() => {
      const mockUrl = `https://mock-storage.com/${Date.now()}_${file.name}`;
      console.log('Upload complete. Mock URL:', mockUrl);
      resolve({ file_url: mockUrl });
    }, 1500);
  });
};