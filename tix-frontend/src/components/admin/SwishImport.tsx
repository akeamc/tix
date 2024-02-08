import { uploadSwishReport } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Button from "../Button";
import { Upload } from "react-feather";
import Modal from "../Modal";
import { Dialog } from "@headlessui/react";
import { useOrders } from "@/lib/hooks";

export default function SwishImport() {
  const [file, setFile] = useState<File | null>(null);
  const { refetch } = useOrders();
  const [open, setOpen] = useState(false);
  const { mutate } = useMutation({
    mutationKey: ["swishImport"],
    mutationFn: async () => {
      if (!file) {
        return;
      }

      return uploadSwishReport(file);
    },
    onSuccess: () => {
      refetch();
      setOpen(false);
    },
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload />
        Importera Swishrapport
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div className="mt-3 text-center sm:mt-0 sm:text-left">
            <Dialog.Title
              as="h3"
              className="text-base font-semibold leading-6 text-gray-900"
            >
              Importera Swishrapport
            </Dialog.Title>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Använd inte den här funktionen om du inte är ekonomiansvarig.
              </p>
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
            onClick={() => mutate()}
          >
            Importera
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            onClick={() => setOpen(false)}
          >
            Avbryt
          </button>
        </div>
      </Modal>
    </>
  );
}
