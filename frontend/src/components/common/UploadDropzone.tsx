import React, { useState } from 'react'

interface UploadDropzoneProps {
  label?: string;
  subtext?: string;
  height?: string;
  onFileChange?: (file?: File) => void;
  acceptedTypes?: string;
  id?: string;
}

const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  label = 'Click to upload',
  subtext = 'or drag and drop',
  height = 'h-16',
  onFileChange = () => {},
  acceptedTypes = 'image/*',
  id = 'dropzone-file',
}) => {
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : undefined
    if (file) {
      onFileChange(file)
      setSuccess(true)
    }
  }

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className={`flex flex-col items-center justify-center w-full ${height} border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-100 hover:border-gray-400`}
      >
        <div className="flex flex-col items-center justify-center px-4 py-2 text-center">
          <svg
            className="w-6 h-6 mb-1 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
            aria-hidden="true"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 2v8m0 0l-3-3m3 3l3-3M4 14h12"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-xs text-gray-500">{subtext}</span>
        </div>
        <input
          id={id}
          type="file"
          accept={acceptedTypes}
          className="hidden"
          onChange={handleChange}
        />
      </label>

      {/* ✅ Success message */}
      {success && (
        <p className="mt-2 text-sm text-green-600">Uploaded successfully!</p>
      )}
    </div>
  )
}

export default UploadDropzone
