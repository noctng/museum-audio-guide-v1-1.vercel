import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// NEW: Import AlertDialog và icon thùng rác
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, FilePenLine, Trash2 } from 'lucide-react';

export default function ArtifactManagementPage() {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingArtifact, setEditingArtifact] = useState(null);

  // ... (phần initialFormData và formData không đổi)
  const initialFormData = {
    artifact_code: '',
    image_url: '',
    title_en: '', title_vi: '', title_zh: '', title_ko: '', title_ja: '', title_fr: '', title_de: '',
    desc_en: '', desc_vi: '', desc_zh: '', desc_ko: '', desc_ja: '', desc_fr: '', desc_de: '',
    audio_en: '', audio_vi: '', audio_zh: '', audio_ko: '', audio_ja: '', audio_fr: '', audio_de: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // NEW: State cho chức năng xóa
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [artifactToDelete, setArtifactToDelete] = useState(null);


  useEffect(() => {
    fetchArtifacts();
  }, []);

  const fetchArtifacts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('AudioGuide').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching artifacts:', error);
    else setArtifacts(data);
    setLoading(false);
  };

  // ... (phần handleInputChange, handleEditClick, handleDialogClose không đổi)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEditClick = (artifact) => {
    setEditingArtifact(artifact);
    setFormData({
      artifact_code: artifact.artifact_code,
      image_url: artifact.image_url || '',
      title_en: artifact.title?.en || '', title_vi: artifact.title?.vi || '', title_zh: artifact.title?.zh || '',
      title_ko: artifact.title?.ko || '', title_ja: artifact.title?.ja || '', title_fr: artifact.title?.fr || '', title_de: artifact.title?.de || '',
      desc_en: artifact.description?.en || '', desc_vi: artifact.description?.vi || '', desc_zh: artifact.description?.zh || '',
      desc_ko: artifact.description?.ko || '', desc_ja: artifact.description?.ja || '', desc_fr: artifact.description?.fr || '', desc_de: artifact.description?.de || '',
      audio_en: artifact.audio_urls?.en || '', audio_vi: artifact.audio_urls?.vi || '', audio_zh: artifact.audio_urls?.zh || '',
      audio_ko: artifact.audio_urls?.ko || '', audio_ja: artifact.audio_urls?.ja || '', audio_fr: artifact.audio_urls?.fr || '', audio_de: artifact.audio_urls?.de || '',
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setEditingArtifact(null);
    setFormData(initialFormData);
    setIsDialogOpen(false);
  }

  const handleSubmit = async (e) => {
    // ... (logic handleSubmit không đổi)
    e.preventDefault();
    
    const artifactData = {
      artifact_code: formData.artifact_code.toUpperCase(),
      image_url: formData.image_url,
      title: {
        en: formData.title_en, vi: formData.title_vi, zh: formData.title_zh,
        ko: formData.title_ko, ja: formData.title_ja, fr: formData.title_fr, de: formData.title_de,
      },
      description: {
        en: formData.desc_en, vi: formData.desc_vi, zh: formData.desc_zh,
        ko: formData.desc_ko, ja: formData.desc_ja, fr: formData.desc_fr, de: formData.desc_de,
      },
       audio_urls: {
        en: formData.audio_en, vi: formData.audio_vi, zh: formData.audio_zh,
        ko: formData.audio_ko, ja: formData.audio_ja, fr: formData.audio_fr, de: formData.audio_de,
      }
    };
    
    let error;
    if (editingArtifact) {
      const { error: updateError } = await supabase.from('AudioGuide').update(artifactData).eq('id', editingArtifact.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('AudioGuide').insert([artifactData]);
      error = insertError;
    }

    if (error) {
      alert('Error saving artifact: ' + error.message);
    } else {
      alert(`Artifact ${editingArtifact ? 'updated' : 'added'} successfully!`);
      handleDialogClose();
      fetchArtifacts();
    }
  };

  // NEW: Hàm mở hộp thoại xác nhận xóa
  const handleDeleteClick = (artifact) => {
    setArtifactToDelete(artifact);
    setIsAlertOpen(true);
  };

  // NEW: Hàm thực hiện xóa sau khi xác nhận
  const handleConfirmDelete = async () => {
    if (!artifactToDelete) return;

    const { error } = await supabase
      .from('AudioGuide')
      .delete()
      .eq('id', artifactToDelete.id);

    if (error) {
      alert('Error deleting artifact: ' + error.message);
    } else {
      alert(`Artifact ${artifactToDelete.artifact_code} deleted successfully!`);
      fetchArtifacts(); // Tải lại danh sách sau khi xóa
    }

    // Đóng hộp thoại và reset state
    setIsAlertOpen(false);
    setArtifactToDelete(null);
  };


  return (
    <div className="p-4 sm:p-8">
      <Card>
        {/* ... (Phần CardHeader và Dialog của Add/Edit không đổi) */}
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Artifact Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => isOpen ? setIsDialogOpen(true) : handleDialogClose()}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingArtifact ? 'Edit Artifact' : 'Add New AudioGuide'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                 <div className='space-y-1'>
                    <label htmlFor="artifact_code" className="font-semibold">Artifact Code</label>
                    <Input id="artifact_code" name="artifact_code" value={formData.artifact_code} onChange={handleInputChange} required disabled={!!editingArtifact} />
                </div>
                 
                 <div className='space-y-1'>
                    <label htmlFor="image_url" className="font-semibold">Image URL</label>
                    <Input id="image_url" name="image_url" placeholder="https://example.com/image.png" value={formData.image_url} onChange={handleInputChange} />
                </div>
                
                <h3 className='font-semibold mt-4 border-b pb-2'>Title</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                    <Input name="title_en" placeholder="English" value={formData.title_en} onChange={handleInputChange}/>
                    <Input name="title_vi" placeholder="Vietnamese" value={formData.title_vi} onChange={handleInputChange}/>
                    <Input name="title_zh" placeholder="Chinese" value={formData.title_zh} onChange={handleInputChange}/>
                    <Input name="title_ko" placeholder="Korean" value={formData.title_ko} onChange={handleInputChange}/>
                    <Input name="title_ja" placeholder="Japanese" value={formData.title_ja} onChange={handleInputChange}/>
                    <Input name="title_fr" placeholder="French" value={formData.title_fr} onChange={handleInputChange}/>
                    <Input name="title_de" placeholder="German" value={formData.title_de} onChange={handleInputChange}/>
                </div>

                <h3 className='font-semibold mt-4 border-b pb-2'>Description</h3>
                <div className='space-y-3'>
                    <Textarea name="desc_en" placeholder="English Description" value={formData.desc_en} onChange={handleInputChange}/>
                    <Textarea name="desc_vi" placeholder="Vietnamese Description" value={formData.desc_vi} onChange={handleInputChange}/>
                    <Textarea name="desc_zh" placeholder="Chinese Description" value={formData.desc_zh} onChange={handleInputChange}/>
                    <Textarea name="desc_ko" placeholder="Korean Description" value={formData.desc_ko} onChange={handleInputChange}/>
                    <Textarea name="desc_ja" placeholder="Japanese Description" value={formData.desc_ja} onChange={handleInputChange}/>
                    <Textarea name="desc_fr" placeholder="French Description" value={formData.desc_fr} onChange={handleInputChange}/>
                    <Textarea name="desc_de" placeholder="German Description" value={formData.desc_de} onChange={handleInputChange}/>
                </div>

                <h3 className='font-semibold mt-4 border-b pb-2'>Audio URLs</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                    <Input name="audio_en" placeholder="English Audio URL" value={formData.audio_en} onChange={handleInputChange}/>
                    <Input name="audio_vi" placeholder="Vietnamese Audio URL" value={formData.audio_vi} onChange={handleInputChange}/>
                    <Input name="audio_zh" placeholder="Chinese Audio URL" value={formData.audio_zh} onChange={handleInputChange}/>
                    <Input name="audio_ko" placeholder="Korean Audio URL" value={formData.audio_ko} onChange={handleInputChange}/>
                    <Input name="audio_ja" placeholder="Japanese Audio URL" value={formData.audio_ja} onChange={handleInputChange}/>
                    <Input name="audio_fr" placeholder="French Audio URL" value={formData.audio_fr} onChange={handleInputChange}/>
                    <Input name="audio_de" placeholder="German Audio URL" value={formData.audio_de} onChange={handleInputChange}/>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title (EN)</TableHead>
                  <TableHead>Description (EN)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artifacts.map((artifact) => (
                  <TableRow key={artifact.id}>
                    <TableCell className="font-medium">{artifact.artifact_code}</TableCell>
                    <TableCell>{artifact.title?.en}</TableCell>
                    <TableCell className="max-w-sm truncate">{artifact.description?.en}</TableCell>
                    {/* MODIFIED: Thêm nút xóa vào cột Actions */}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditClick(artifact)}>
                          <FilePenLine className="h-4 w-4" />
                        </Button>
                        {/* NEW: Nút xóa */}
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(artifact)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* NEW: Hộp thoại xác nhận xóa */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the artifact{' '}
              <span className="font-bold">{artifactToDelete?.artifact_code}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setArtifactToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}