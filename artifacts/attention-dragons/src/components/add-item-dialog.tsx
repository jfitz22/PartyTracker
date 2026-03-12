import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CATEGORY_MAP, RARITY_MAP, RECHARGE_MAP } from '@/lib/constants';
import { 
  InventoryItem,
  CreateItemRequestCategory, 
  CreateItemRequestRarity, 
  CreateItemRequestRechargeOn,
  CreateItemRequestLocation
} from '@workspace/api-client-react';
import { useCreateItem, useUpdateItem, getListItemsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles, Save } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.nativeEnum(CreateItemRequestCategory),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  location: z.nativeEnum(CreateItemRequestLocation).default(CreateItemRequestLocation.carried),
  isConsumable: z.boolean().default(false),
  rarity: z.nativeEnum(CreateItemRequestRarity).optional().nullable(),
  maxCharges: z.coerce.number().min(0).optional().nullable(),
  rechargeOn: z.nativeEnum(CreateItemRequestRechargeOn).optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddItemDialogProps {
  characterId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: InventoryItem | null;
}

export function AddItemDialog({ characterId, open, onOpenChange, editingItem }: AddItemDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingItem;
  const isMobile = useIsMobile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: CreateItemRequestCategory.misc,
      description: "",
      imageUrl: "",
      location: CreateItemRequestLocation.carried,
      isConsumable: false,
      rarity: null,
      maxCharges: null,
      rechargeOn: null,
    },
  });

  useEffect(() => {
    if (open && editingItem) {
      form.reset({
        name: editingItem.name,
        category: editingItem.category as CreateItemRequestCategory,
        description: editingItem.description,
        imageUrl: editingItem.imageUrl || "",
        location: (editingItem.location as CreateItemRequestLocation) || CreateItemRequestLocation.carried,
        isConsumable: editingItem.isConsumable,
        rarity: (editingItem.rarity as CreateItemRequestRarity) || null,
        maxCharges: editingItem.maxCharges,
        rechargeOn: (editingItem.rechargeOn as CreateItemRequestRechargeOn) || null,
      });
    } else if (open && !editingItem) {
      form.reset({
        name: "",
        category: CreateItemRequestCategory.misc,
        description: "",
        imageUrl: "",
        location: CreateItemRequestLocation.carried,
        isConsumable: false,
        rarity: null,
        maxCharges: null,
        rechargeOn: null,
      });
    }
  }, [open, editingItem, form]);

  const { mutate: createItem, isPending: isCreating } = useCreateItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey(characterId) });
        onOpenChange(false);
      }
    }
  });

  const { mutate: updateItem, isPending: isUpdating } = useUpdateItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey(characterId) });
        onOpenChange(false);
      }
    }
  });

  const onSubmit = (data: FormValues) => {
    const isEquipped = data.location === CreateItemRequestLocation.equipped;
    
    const payload = {
      ...data,
      isEquipped,
      imageUrl: data.imageUrl || null,
      ...( !isEditing && data.maxCharges ? { currentCharges: data.maxCharges } : {} )
    };

    if (isEditing) {
      updateItem({ characterId, itemId: editingItem.id, data: payload });
    } else {
      createItem({ characterId, data: payload as any });
    }
  };

  const isPending = isCreating || isUpdating;

  const content = (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ring of Protection" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CATEGORY_MAP).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Magical properties, damage dice, lore..." 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="rarity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rarity (Optional)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(RARITY_MAP).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-secondary/30">
            <div className="space-y-4">
              <h4 className="font-display text-primary font-semibold">Magical Charges</h4>
              <FormField
                control={form.control}
                name="maxCharges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Charges</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        value={field.value || ""} 
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormDescription>Leave empty if item has no charges.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rechargeOn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recharge Condition</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || undefined}
                      disabled={!form.watch("maxCharges")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(RECHARGE_MAP).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <h4 className="font-display text-primary font-semibold">Properties</h4>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="equipped">Equipped</SelectItem>
                        <SelectItem value="carried">In Bag</SelectItem>
                        <SelectItem value="stored">In Storage Vault</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Where is this item currently?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isConsumable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 shadow-sm bg-background">
                    <div className="space-y-0.5">
                      <FormLabel>Consumable</FormLabel>
                      <FormDescription>Is it destroyed on use? (e.g. Potion)</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 pb-8">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="magical" disabled={isPending}>
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? "Update Artifact" : "Conjure Artifact"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              {isEditing ? "Modify Artifact" : "Conjure New Artifact"}
            </SheetTitle>
            <SheetDescription>
              Scribe the details of this item into your magical inventory.
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {isEditing ? "Modify Artifact" : "Conjure New Artifact"}
          </DialogTitle>
          <DialogDescription>
            Scribe the details of this item into your magical inventory.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
