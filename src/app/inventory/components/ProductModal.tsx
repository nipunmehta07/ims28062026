"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Dropdown,
} from "@/components/ui";
import { FormField } from "@/components/composite/FormField";
import { FileUpload } from "@/components/ui/FileUpload";
import { addItemAction, updateItemAction, deleteItemAction } from "@/app/actions";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  unit: string;
  images: File[];
  variants: ProductVariant[];
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    sku: string;
    category: string;
    quantityOnHand: number;
    unit: string;
    unitCost: number;
    description?: string;
  } | null;
  mode?: "create" | "edit";
}

const CATEGORIES = [
  { value: "Raw Material", label: "Raw Material" },
  { value: "Component", label: "Component" },
  { value: "Finished Good", label: "Finished Good" },
  { value: "Packaging", label: "Packaging" },
];

const UNITS = [
  { value: "pcs", label: "pcs" },
  { value: "kg", label: "kg" },
  { value: "L", label: "L" },
  { value: "m", label: "m" },
  { value: "box", label: "box" },
  { value: "roll", label: "roll" },
];

const initialFormData: ProductFormData = {
  name: "",
  sku: "",
  category: "Component",
  description: "",
  price: 0,
  stock: 0,
  unit: "pcs",
  images: [],
  variants: [],
};

export function ProductModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  mode = "create",
}: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        name: initialData.name || "",
        sku: initialData.sku || "",
        category: initialData.category || "Component",
        description: initialData.description || "",
        price: initialData.unitCost || 0,
        stock: initialData.quantityOnHand || 0,
        unit: initialData.unit || "pcs",
        images: [],
        variants: [],
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [initialData, mode, isOpen]);

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }
    if (!formData.sku.trim()) {
      newErrors.sku = "SKU is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (formData.price < 0) {
      newErrors.price = "Price cannot be negative";
    }
    if (formData.stock < 0) {
      newErrors.stock = "Stock cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const t = toast.loading(mode === "edit" ? "Updating product..." : "Creating product...");

    try {
      if (mode === "edit" && initialData) {
        await updateItemAction(initialData.id, {
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          unit: formData.unit,
          unitCost: formData.price,
        });
        toast.success("Product updated successfully!", { id: t });
      } else {
        await addItemAction({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          unit: formData.unit,
          unitCost: formData.price,
          initialQty: formData.stock,
          openingStockDate: new Date().toISOString().split("T")[0],
        });
        toast.success("Product created successfully!", { id: t });
      }
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save product";
      toast.error(message, { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    setIsSubmitting(true);
    const t = toast.loading("Deleting product...");

    try {
      await deleteItemAction(initialData.id);
      toast.success("Product deleted successfully!", { id: t });
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete product";
      toast.error(message, { id: t });
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      sku: "",
      price: 0,
      stock: 0,
    };
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  };

  const handleUpdateVariant = (id: string, field: keyof ProductVariant, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    }));
  };

  const handleRemoveVariant = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((v) => v.id !== id),
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFieldChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showCloseButton
      closeOnBackdrop
      closeOnEscape
    >
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <div className="flex items-center justify-between">
            <div>
              <ModalTitle>
                {mode === "edit" ? "Edit Product" : "Add New Product"}
              </ModalTitle>
              <ModalDescription>
                {mode === "edit"
                  ? "Update product information and settings."
                  : "Fill in the details to create a new product."}
              </ModalDescription>
            </div>
            {mode === "edit" && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} />
                Delete
              </Button>
            )}
          </div>
        </ModalHeader>

        <ModalContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Product Name"
              error={errors.name}
              required
            >
              <Input
                value={formData.name}
                onChange={(e: any) => handleFieldChange("name", e.target.value)}
                placeholder="e.g. Chrome Basin Mixer"
                error={errors.name}
                floating
              />
            </FormField>

            <FormField
              label="SKU / Part Number"
              error={errors.sku}
              required
            >
              <Input
                value={formData.sku}
                onChange={(e: any) => handleFieldChange("sku", e.target.value)}
                placeholder="ZOIE-BM-001"
                error={errors.sku}
                floating
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Category" error={errors.category} required>
              <Dropdown
                options={CATEGORIES}
                value={formData.category}
                onChange={(val: any) => handleFieldChange("category", val)}
                placeholder="Select category"
                error={errors.category}
              />
            </FormField>

            <FormField label="Unit" required>
              <Dropdown
                options={UNITS}
                value={formData.unit}
                onChange={(val: any) => handleFieldChange("unit", val)}
              />
            </FormField>

            <FormField label="Price (₹)" error={errors.price}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e: any) => handleFieldChange("price", parseFloat(e.target.value) || 0)}
                error={errors.price}
                floating
              />
            </FormField>
          </div>

          <FormField label="Description">
            <Textarea
              value={formData.description}
              onChange={(e: any) => handleFieldChange("description", e.target.value)}
              placeholder="Enter product description..."
              rows={3}
            />
          </FormField>

          {/* Stock (only for new products) */}
          {mode === "create" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Initial Stock" error={errors.stock}>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e: any) => handleFieldChange("stock", parseInt(e.target.value) || 0)}
                  error={errors.stock}
                  floating
                />
              </FormField>
            </div>
          )}

          {/* Image Upload */}
          <FormField label="Product Images">
            <FileUpload
              accept="image/*"
              multiple
              maxFiles={5}
              maxSize={5}
              onChange={(files: any) => handleFieldChange("images", files)}
              showPreview
            />
          </FormField>

          {/* Variants Section */}
          <div className="border-t border-emerald-500/10 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Product Variants
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  Add size, color, or other variations
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddVariant}
              >
                <Plus size={14} />
                Add Variant
              </Button>
            </div>

            {formData.variants.length > 0 && (
              <div className="space-y-3">
                {formData.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="grid grid-cols-5 gap-3 p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-xl border border-emerald-500/10"
                  >
                    <FormField label="Name" className="col-span-2">
                      <Input
                        value={variant.name}
                        onChange={(e: any) =>
                          handleUpdateVariant(variant.id, "name", e.target.value)
                        }
                        placeholder="e.g. Large"
                        floating
                      />
                    </FormField>
                    <FormField label="SKU">
                      <Input
                        value={variant.sku}
                        onChange={(e: any) =>
                          handleUpdateVariant(variant.id, "sku", e.target.value)
                        }
                        placeholder="VAR-001"
                        floating
                      />
                    </FormField>
                    <FormField label="Price">
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={(e: any) =>
                          handleUpdateVariant(
                            variant.id,
                            "price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        floating
                      />
                    </FormField>
                    <div className="flex items-end gap-2">
                      <FormField label="Stock" className="flex-1">
                        <Input
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(e: any) =>
                            handleUpdateVariant(
                              variant.id,
                              "stock",
                              parseInt(e.target.value) || 0
                            )
                          }
                          floating
                        />
                      </FormField>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariant(variant.id)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.variants.length === 0 && (
              <div className="text-center py-8 text-[11px] text-gray-400 font-medium">
                No variants added yet. Click &quot;Add Variant&quot; to create one.
              </div>
            )}
          </div>
        </ModalContent>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" isLoading={isSubmitting}>
            {mode === "edit" ? "Save Changes" : "Create Product"}
          </Button>
        </ModalFooter>
      </form>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-rose-200 dark:border-rose-900">
            <h3 className="text-lg font-black uppercase tracking-tight bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent mb-2">
              Delete Product?
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-6">
              This action cannot be undone. The product will be permanently
              removed from your inventory.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isSubmitting}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default ProductModal;