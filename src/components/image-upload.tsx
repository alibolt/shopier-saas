"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'

interface ImageUploadProps {
  value: string[]
  onChange: (value: string[]) => void
  maxFiles?: number
  disabled?: boolean
}

export function ImageUpload({ 
  value = [], 
  onChange, 
  maxFiles = 5,
  disabled = false 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (value.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`)
      return
    }

    setUploading(true)

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const data = await response.json()
        return data.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      onChange([...value, ...uploadedUrls])
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }, [value, onChange, maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: maxFiles - value.length,
    disabled: disabled || uploading || value.length >= maxFiles,
  })

  const removeImage = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
        } ${(disabled || uploading || value.length >= maxFiles) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Drop the images here'
                : `Drag & drop images here, or click to select`}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {value.length >= maxFiles
                ? `Maximum ${maxFiles} images reached`
                : `${value.length}/${maxFiles} images uploaded`}
            </p>
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div key={url} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={url}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
                disabled={disabled || uploading}
              >
                <X className="h-4 w-4" />
              </Button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}