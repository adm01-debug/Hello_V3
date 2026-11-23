 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Label } from '@/components/ui/label';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { Separator } from '@/components/ui/separator';
 import { Save, Loader2, Camera, Trash2 } from 'lucide-react';
 import { useProfile } from '@/hooks/useProfile';
 import { useAvatar, AVATAR_ACCEPT } from '@/hooks/useAvatar';
 import { useRef, useState, useEffect } from 'react';
 
 export function ProfileSettings() {
   const { profile, isLoading, updateProfile } = useProfile();
   const { signedUrl, uploading, uploadAvatar, removeAvatar } = useAvatar(profile?.avatar_url);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [name, setName] = useState('');
 
   useEffect(() => {
     if (profile?.full_name) setName(profile.full_name);
   }, [profile]);
 
   const handleSave = () => {
     updateProfile.mutate({ full_name: name });
   };
 
   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     // Reseta o input para permitir reenviar o mesmo arquivo após um erro.
     event.target.value = '';
     if (!file) return;
     const newPath = await uploadAvatar(file);
     if (newPath) updateProfile.mutate({ avatar_url: newPath });
   };

   const handleRemovePhoto = async () => {
     const ok = await removeAvatar();
     if (ok) updateProfile.mutate({ avatar_url: null });
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
           <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-bold text-primary">
             {signedUrl ? (
               <img src={signedUrl} alt="Sua foto de perfil" className="h-full w-full object-cover" />
             ) : name ? (
               name.slice(0, 2).toUpperCase()
             ) : (
               '??'
             )}
           </div>
           <div className="flex flex-wrap items-center gap-2">
             <input
               ref={fileInputRef}
               type="file"
               accept={AVATAR_ACCEPT}
               className="hidden"
               onChange={handleFileChange}
             />
             <Button
               variant="outline"
               className="gap-2"
               onClick={() => fileInputRef.current?.click()}
               disabled={uploading}
             >
               {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
               Alterar foto
             </Button>
             {profile?.avatar_url && (
               <Button
                 variant="ghost"
                 className="gap-2 text-destructive hover:text-destructive"
                 onClick={handleRemovePhoto}
                 disabled={uploading}
               >
                 <Trash2 className="h-4 w-4" />
                 Remover
               </Button>
             )}
           </div>
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