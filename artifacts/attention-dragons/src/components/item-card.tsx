import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  InventoryItem, 
  InventoryItemRarity 
} from '@workspace/api-client-react';
import { 
  useUseItem, 
  useToggleEquip, 
  useDeleteItem,
  getListItemsQueryKey 
} from '@workspace/api-client-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_MAP, RARITY_MAP, RECHARGE_MAP } from '@/lib/constants';
import { Edit, Trash2, Shield, Moon, Sun, Clock, Sparkles, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ItemCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
}

export function ItemCard({ item, onEdit }: ItemCardProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { mutate: toggleEquip, isPending: isToggling } = useToggleEquip({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey(item.characterId) });
      }
    }
  });

  const { mutate: useCharge, isPending: isUsing } = useUseItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey(item.characterId) });
      }
    }
  });

  const { mutate: deleteItem, isPending: isDeletingAction } = useDeleteItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey(item.characterId) });
      }
    }
  });

  const categoryInfo = CATEGORY_MAP[item.category];
  const CategoryIcon = categoryInfo?.icon || Package;
  const rarityInfo = item.rarity ? RARITY_MAP[item.rarity as InventoryItemRarity] : null;

  const hasCharges = item.maxCharges !== null && item.maxCharges !== undefined && item.maxCharges > 0;
  const currentCharges = item.currentCharges ?? 0;
  
  const canUseCharge = hasCharges && currentCharges > 0 && !item.isConsumed;
  const canConsume = item.isConsumable && !item.isConsumed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "h-full flex flex-col transition-all duration-300 relative",
        item.isEquipped ? "glow-primary border-primary/50" : "border-border hover:border-primary/30",
        item.isConsumed && "opacity-60 grayscale-[50%]",
        rarityInfo && !item.isEquipped && `border-t-2 border-t-${item.rarity}` // Subtle rarity hint
      )}>
        {/* Rarity Glow subtle inset */}
        {rarityInfo && (
          <div className={cn("absolute inset-0 pointer-events-none opacity-20", rarityInfo.colorClass.replace('text-', 'bg-'))} style={{ filter: 'blur(40px)' }} />
        )}

        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-secondary border border-border">
                <CategoryIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground leading-tight">{item.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{categoryInfo?.label}</Badge>
                  {rarityInfo && (
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", rarityInfo.colorClass)}>
                      {rarityInfo.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow pb-4">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{item.description}</p>
          
          {item.imageUrl && (
            <div className="mt-4 rounded-md overflow-hidden border border-border/50 max-h-40">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}

          {hasCharges && (
            <div className="mt-6 p-3 rounded-lg bg-secondary/50 border border-border/50 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-wider font-bold font-display">
                <span>Arcane Charges</span>
                {item.rechargeOn && (
                  <span className="flex items-center gap-1 text-primary">
                    {item.rechargeOn === 'dawn' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                    Recharges: {RECHARGE_MAP[item.rechargeOn]}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: item.maxCharges! }).map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-4 h-4 rounded-full border-2 shadow-inner transition-all duration-300",
                      i < currentCharges 
                        ? "bg-primary border-primary glow-accent" 
                        : "bg-background border-border"
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-3 pt-0">
          {/* Action Row */}
          <div className="w-full flex gap-2">
            {(canUseCharge || canConsume) && (
              <Button 
                variant="magical" 
                className="flex-1" 
                onClick={() => useCharge({ characterId: item.characterId, itemId: item.id })}
                disabled={isUsing || item.isConsumed}
              >
                <Sparkles className="w-4 h-4" />
                {canConsume && !hasCharges ? "Consume" : "Use Charge"}
              </Button>
            )}
            
            <Button 
              variant={item.isEquipped ? "default" : "secondary"}
              className="flex-1"
              onClick={() => toggleEquip({ characterId: item.characterId, itemId: item.id })}
              disabled={isToggling}
            >
              <Shield className="w-4 h-4" />
              {item.isEquipped ? "Equipped" : "Stowed"}
            </Button>
          </div>

          {/* Utility Row */}
          <div className="w-full flex justify-end gap-2 border-t border-border/50 pt-3">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onEdit(item)}>
              <Edit className="w-4 h-4" />
            </Button>
            
            {!isDeleting ? (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setIsDeleting(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-1 bg-destructive/10 rounded-md p-1 pl-3">
                <span className="text-xs text-destructive font-bold pr-2">Confirm?</span>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-muted-foreground" onClick={() => setIsDeleting(false)}>No</Button>
                <Button size="sm" variant="destructive" className="h-6 px-2" onClick={() => deleteItem({ characterId: item.characterId, itemId: item.id })} disabled={isDeletingAction}>Yes</Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
