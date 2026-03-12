import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useGetCharacter, useListItems, useTriggerRest, getListItemsQueryKey } from '@workspace/api-client-react';
import { InventoryItem, InventoryItemCategory, RestRequestRestType } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ItemCard } from '@/components/item-card';
import { AddItemDialog } from '@/components/add-item-dialog';
import { CATEGORY_MAP } from '@/lib/constants';
import { ArrowLeft, Moon, Search, Sun, Plus, PackageOpen } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

export default function CharacterHub() {
  const { characterId } = useParams<{ characterId: string }>();
  const id = parseInt(characterId, 10);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showConsumed, setShowConsumed] = useState(false);

  const { data: character, isLoading: charLoading } = useGetCharacter(id);
  const { data: items = [], isLoading: itemsLoading } = useListItems(id);

  const { mutate: triggerRest, isPending: isResting } = useTriggerRest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey(id) });
      }
    }
  });

  const handleRest = (restType: RestRequestRestType) => {
    triggerRest({ characterId: id, data: { restType } });
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsAddItemOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setIsAddItemOpen(open);
    if (!open) setTimeout(() => setEditingItem(null), 200); // Wait for exit animation
  };

  // Filtering Logic locally for snappier UI since data set per character is small
  const filteredItems = items.filter(item => {
    if (!showConsumed && item.isConsumed) return false;
    if (showConsumed && !item.isConsumed) return false;
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (charLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-primary font-display text-2xl animate-pulse">Consulting the Archives...</div>;
  if (!character) return <div className="min-h-screen bg-background flex items-center justify-center text-destructive font-display text-2xl">Character not found in the vault.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative">
      {/* Subtle Background Texture */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/parchment-texture.png)`, backgroundRepeat: 'repeat' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/50 bg-secondary shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                <img 
                  src={character.avatarUrl || `${import.meta.env.BASE_URL}images/avatar-placeholder.png`} 
                  alt={character.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold text-primary tracking-wide drop-shadow-md">{character.name}</h1>
                <p className="text-muted-foreground font-sans mt-1">Level {character.level} {character.race} {character.characterClass}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => handleRest(RestRequestRestType.short_rest)}
              disabled={isResting}
            >
              <Sun className="w-4 h-4 mr-2" /> Short Rest
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none border-accent/50 text-accent hover:bg-accent/10"
              onClick={() => handleRest(RestRequestRestType.long_rest)}
              disabled={isResting}
            >
              <Moon className="w-4 h-4 mr-2" /> Long Rest
            </Button>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 bg-card/50 p-4 rounded-xl border border-border backdrop-blur-sm">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search artifacts..." 
              className="pl-9 bg-background border-border/50 focus-visible:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between w-full lg:w-auto gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setShowConsumed(!showConsumed)}
              className={showConsumed ? "text-primary bg-primary/10" : "text-muted-foreground"}
            >
              <PackageOpen className="w-4 h-4 mr-2" />
              {showConsumed ? "Viewing Consumed" : "View Consumed"}
            </Button>
            <Button variant="magical" onClick={() => setIsAddItemOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          </div>
        </div>

        {/* Categories & Items Grid */}
        {!showConsumed && (
          <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
            <TabsList className="bg-card/80 border border-border flex flex-wrap h-auto p-1 mb-8">
              <TabsTrigger value="all" className="font-display">All Artifacts</TabsTrigger>
              {Object.entries(CATEGORY_MAP).map(([key, { label, icon: Icon }]) => (
                <TabsTrigger key={key} value={key} className="font-display flex items-center gap-2">
                  <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {showConsumed && (
          <div className="mb-8 flex items-center gap-3 border-b border-border pb-4">
            <h2 className="text-2xl font-display text-muted-foreground">The Graveyard</h2>
            <Badge variant="outline">Consumed & Empty Items</Badge>
          </div>
        )}

        {itemsLoading ? (
          <div className="flex justify-center py-24"><div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-24 bg-card/30 rounded-2xl border border-dashed border-border">
            <PackageOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-2xl font-display text-muted-foreground mb-2">No items found</h3>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
              {search ? "Your search yielded no artifacts matching that description." : "Your inventory is bare. Visit a merchant or loot a dungeon to acquire items."}
            </p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} onEdit={handleEdit} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

      </div>

      <AddItemDialog 
        characterId={id} 
        open={isAddItemOpen} 
        onOpenChange={handleCloseDialog} 
        editingItem={editingItem} 
      />
    </div>
  );
}
