 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Label } from '@/components/ui/label';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { Separator } from '@/components/ui/separator';
 import { Save, Loader2 } from 'lucide-react';
 import { useProfile } from '@/hooks/useProfile';
 import { useState, useEffect } from 'react';
 
 export function ProfileSettings() {
   const { profile, isLoading, updateProfile } = useProfile();
   const [name, setName] = useState('');
 
   useEffect(() => {
     if (profile?.full_name) setName(profile.full_name);
   }, [profile]);
 
   const handleSave = () => {
     updateProfile.mutate({ full_name: name });
   };
 
   if (isLoading) {
     return (
       <div className="flex justify-center p-8">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <Card>
       <CardHeader>
         <CardTitle>Informações do Perfil</CardTitle>
         <CardDescription>Atualize suas informações pessoais</CardDescription>
       </CardHeader>
       <CardContent className="space-y-6">
         <div className="flex items-center gap-6">
           <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
             {name ? name.slice(0, 2).toUpperCase() : '??'}
           </div>
           <Button variant="outline">Alterar foto</Button>
         </div>
 
         <Separator />
 
         <div className="grid gap-4 md:grid-cols-2">
           <div className="space-y-2">
             <Label htmlFor="name">Nome completo</Label>
             <Input 
               id="name" 
               value={name} 
               onChange={(e) => setName(e.target.value)}
               placeholder="Seu nome completo"
             />
           </div>
           <div className="space-y-2">
             <Label htmlFor="email">Email</Label>
             <Input id="email" type="email" value={profile?.email || ''} disabled />
           </div>
           <div className="space-y-2">
             <Label htmlFor="role">Papel</Label>
             <Input id="role" value={profile?.role || ''} disabled className="capitalize" />
           </div>
         </div>
 
         <Button 
           className="gap-2" 
           onClick={handleSave}
           disabled={updateProfile.isPending}
         >
           {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
           Salvar alterações
         </Button>
       </CardContent>
     </Card>
   );
 }