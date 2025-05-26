import { Dialog, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { ShareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/solid';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

const ShareDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const { t } = useTranslation()
  const openDialog = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setIsOpen(true)
    }
  }

  const closeDialog = () => {
    setIsOpen(false)
    setCopied(true)
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
        title={t('clipboard:shareDialog.title')}
        aria-label={t('clipboard:shareDialog.title')}
      >
        <ShareIcon className="h-5 w-5" />
      </button>

      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={closeDialog}>
          <div className="min-h-screen px-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30" />
            </TransitionChild>

            {/* Trick to center content */}
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                  aria-label={t('clipboard:shareDialog.close')}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
                <Dialog.Title as="h3" className="flex items-center gap-2 text-lg font-medium text-gray-900">
                  <ClipboardDocumentCheckIcon className="h-16 w-16" />
                  {t('clipboard:shareDialog.title')}
                </Dialog.Title>
                <div className="mt-2 text-sm text-gray-700 text-center bg-green-600 dark:bg-green-700 bg-opacity-70 text-white w-min whitespace-nowrap mx-auto text-sm sm:text-md text-center mb-4 px-2 py-0 block rounded-md">
                  {t('clipboard:shareDialog.description')}
                </div>

                <div className="mt-6 flex justify-center">
                  <QRCodeSVG value={shareUrl} size={192} />
                </div>

                <div className="mt-8 text-sm text-gray-700 text-center">
                  {t('clipboard:shareDialog.description2')}
                </div>

                {/* Placeholder for social share buttons */}
                <div className="mt-6 hidden" id="social-share-buttons">
                  {/* Replace this with actual buttons later */}
                  <div className="text-xs text-gray-500 italic text-center">
                    {t('clipboard:shareDialog.description3')}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition"
                    onClick={closeDialog}
                  >
                    {t('clipboard:shareDialog.close')}
                  </button>
                </div>
              </div>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default ShareDialog
